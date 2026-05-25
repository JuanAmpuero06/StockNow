from fastapi import FastAPI

app = FastAPI(title="StockNow API")

@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
