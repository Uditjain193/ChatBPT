const config = require("../config/config");

const {
  default: ModelClient,
  isUnexpected,
} = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");

const ENDPOINT = "https://models.github.ai/inference";
const MODEL = "openai/gpt-4.1";

const TOKEN = config.githubToken;

const getResponseFromOpenai = async (messageArray) => {
  try {
    const client = ModelClient(ENDPOINT, new AzureKeyCredential(TOKEN));
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...messageArray,
        ],
        temperature: 1.0,
        top_p: 1.0,
        model: MODEL,
      },
    });
    if (isUnexpected(response)) {
      throw response.body.error;
    }
    const aiMessage = response.body.choices[0].message;
    return aiMessage;
  } catch (error) {
    throw error;
  }
};

module.exports = getResponseFromOpenai;
