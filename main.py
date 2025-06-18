from fastapi import FastAPI, Request, Query
from pydantic import BaseModel
import httpx
import uuid
import json

app = FastAPI()

SUPPORTED_MODELS = [
    "gpt-4.1", "gpt-4.1-nano", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini",
    "o1", "o1-mini", "o3-mini", "o4-mini", "o3", "gpt-4.5-preview",
    "chatgpt-4o-latest", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"
]

session_token = None


async def get_id_token():
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyDcCVo5afkPL40sKBf8j3ZACpiDGU74xj4",
            headers={
                "User-Agent": "TheFUCK/2.1.0",
                "Content-Type": "application/json"
            },
            json={"clientType": "CLIENT_TYPE_ANDROID"}
        )
        return res.json()["idToken"]


async def activate_trial(token, deviceid):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://us-central1-aichatbot-d6082.cloudfunctions.net/aichatbotisTrialActive2",
            headers={
                "User-Agent": "okhttp/3.12.13",
                "authorization": f"Bearer {token}",
                "content-type": "application/json; charset=utf-8"
            },
            json={"data": {"deviceid": deviceid}}
        )
        return res.json().get("result", {}).get("trialActive", False)


@app.get("/")
async def root(text: str = Query(...), model: str = Query("o4-mini")):
    if model not in SUPPORTED_MODELS:
        return {"error": "Model not supported"}

    global session_token
    device_id = uuid.uuid4().hex

    if not session_token:
        session_token = await get_id_token()
        await activate_trial(session_token, device_id)

    async with httpx.AsyncClient() as client:
        payload = {
            "data": json.dumps({
                "content": "Hi",
                "chatmodel": model,
                "messages": [{"role": "user", "content": text}],
                "stream": False,
                "deviceid": device_id,
                "subscriberid": "$RCAnonymousID:475151fd351f4d109829a83542725c78",
                "subscribed": True
            })
        }

        res = await client.post(
            "https://us-central1-aichatbot-d6082.cloudfunctions.net/aichatbotai2",
            headers={
                "User-Agent": "okhttp/3.12.13",
                "authorization": f"Bearer {session_token}",
                "content-type": "application/json; charset=utf-8"
            },
            json=payload
        )

        result = res.json()
        try:
            return {
                "response": result["result"]["response"]["choices"][0]["message"]["content"]
            }
        except Exception as e:
            return {"error": str(e), "raw": result}
          
