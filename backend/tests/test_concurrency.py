import pytest
import concurrent.futures
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.domain import User, Product, Inventory, Order, OrderItem
from app.repositories.order import OrderRepository
from app.schemas.order import OrderCreate, OrderItemCreate
from fastapi import HTTPException

# Test concurrency on a real database session to verify Pessimistic Locking
def test_concurrent_order_placement_pessimistic_locking():
    # 1. Setup temporary test data using a dedicated session
    setup_db: Session = SessionLocal()
    
    try:
        # Create a test user
        test_user = setup_db.query(User).filter(User.email == "concurrency_test@example.com").first()
        if not test_user:
            test_user = User(
                email="concurrency_test@example.com",
                hashed_password="hashedpassword123",
                role="operator",
                is_active=True
            )
            setup_db.add(test_user)
            setup_db.commit()
            setup_db.refresh(test_user)
        
        # Create a test product with limited stock
        test_product = Product(
            sku="CONC-SKU-999",
            name="Concurrent Test Product",
            price=15.0,
            description="Testing race conditions"
        )
        setup_db.add(test_product)
        setup_db.commit()
        setup_db.refresh(test_product)
        
        # Set stock = 5, reserved = 0
        test_inventory = Inventory(
            product_id=test_product.id,
            quantity=5,
            reserved_quantity=0
        )
        setup_db.add(test_inventory)
        setup_db.commit()
        
        product_id = test_product.id
        user_id = test_user.id
        
    finally:
        setup_db.close()

    # 2. Define the worker function for threads
    # Each thread MUST open its own DB session to simulate concurrent database transactions
    def place_order_worker():
        db_session: Session = SessionLocal()
        repo = OrderRepository(db_session)
        order_in = OrderCreate(
            items=[
                OrderItemCreate(product_id=product_id, quantity=1)
            ]
        )
        try:
            order = repo.create_order(user_id=user_id, obj_in=order_in)
            return True, order.id
        except HTTPException as e:
            # Revert changes for this transaction
            return False, e.detail
        except Exception as e:
            return False, str(e)
        finally:
            db_session.close()

    # 3. Execute 10 concurrent requests to reserve 1 unit each (only 5 units available)
    successes = []
    failures = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(place_order_worker) for _ in range(10)]
        for future in concurrent.futures.as_completed(futures):
            success, result = future.result()
            if success:
                successes.append(result)
            else:
                failures.append(result)

    # 4. Assertions to verify that Pessimistic Locking prevented overselling
    # We expect exactly 5 successes (since stock is 5) and 5 failures
    assert len(successes) == 5, f"Expected 5 successes, got {len(successes)}. Success order IDs: {successes}"
    assert len(failures) == 5, f"Expected 5 failures, got {len(failures)}. Failure details: {failures}"

    # Verify database state after transactions
    verify_db: Session = SessionLocal()
    try:
        final_inventory = verify_db.query(Inventory).filter(Inventory.product_id == product_id).first()
        assert final_inventory.reserved_quantity == 5, "Expected all 5 items to be reserved"
        assert final_inventory.available_stock == 0, "Expected available stock to be exactly 0"
        
        # 5. Clean up all created resources in reverse order (OrderItem, Order, Inventory, Product, User)
        # Delete order items first
        verify_db.query(OrderItem).filter(OrderItem.product_id == product_id).delete()
        # Delete orders created in the test
        if successes:
            verify_db.query(Order).filter(Order.id.in_(successes)).delete(synchronize_session=False)
        # Delete inventory
        verify_db.query(Inventory).filter(Inventory.product_id == product_id).delete()
        # Delete product
        verify_db.query(Product).filter(Product.id == product_id).delete()
        # Delete user
        verify_db.query(User).filter(User.id == user_id).delete()
        
        verify_db.commit()
    finally:
        verify_db.close()
