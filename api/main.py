from fastapi import FastAPI

app = FastAPI()

@app.get("/api/test") # エンドポイントを /api/test に変更
async def test_endpoint():
    return {"message": "Minimal Vercel Python API test successful"}

@app.post("/api/test") # エンドポイントを /api/test に変更
async def test_endpoint():
    return {"message": "Minimal Vercel Python API test successful"}
