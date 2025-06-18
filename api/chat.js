import crypto from 'crypto';

const openai = {
  models: [
    "gpt-4.1", "gpt-4.1-nano", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini", "o1",
    "o1-mini", "o3-mini", "o4-mini", "o3", "gpt-4.5-preview",
    "chatgpt-4o-latest", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"
  ],
  n: "",
  s: async () => {
    const res = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyDcCVo5afkPL40sKBf8j3ZACpiDGU74xj4', {
      method: 'POST',
      headers: {
        'User-Agent': 'TheFUCK/2.1.0 (Windows; U; Android 99; itel Apalo Build/SBY.9SJU9.1909)',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientType: "CLIENT_TYPE_ANDROID" })
    });
    const json = await res.json();
    return json.idToken;
  },
  t: async (token, deviceid) => {
    const res = await fetch('https://us-central1-aichatbot-d6082.cloudfunctions.net/aichatbotisTrialActive2', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ data: { deviceid } })
    });
    const json = await res.json();
    openai.n = token;
    return json.result.trialActive;
  },
  chat: async (model, messageText) => {
    try {
      if (!openai.models.includes(model)) throw new Error("Invalid model.");
      if (!messageText) throw new Error("Text is required.");

      const deviceid = crypto.randomBytes(32).toString('hex');
      const token = openai.n || await openai.s();
      await openai.t(token, deviceid);

      const res = await fetch('https://us-central1-aichatbot-d6082.cloudfunctions.net/aichatbotai2', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${token}`,
          'content-type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          data: JSON.stringify({
            content: "Hi",
            chatmodel: model,
            messages: [{ role: "user", content: messageText }],
            stream: false,
            deviceid,
            subscriberid: "$RCAnonymousID:475151fd351f4d109829a83542725c78",
            subscribed: true
          })
        })
      });

      const json = await res.json();
      return { response: json.result.response.choices[0].message.content };
    } catch (err) {
      return { error: err.message };
    }
  }
};

export default async function handler(req, res) {
  const { text = "", model = "o4-mini" } = req.query;
  const result = await openai.chat(model, text);
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify(result, null, 2));
}
