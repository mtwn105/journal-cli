const express = require("express");
const morgan = require("morgan");
const axios = require("axios").default;

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(morgan("combined"));

app.get("/auth/notion/callback", async (req, res) => {
  const { code } = req.query;

  // Generate authentication using client and secret
  const auth = Buffer.from(
    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
  ).toString("base64");

  // Generate headers for the request
  const headers = {
    Authorization: `Basic ${auth}`,
  };

  // Generate the request body
  const body = {
    grant_type: "authorization_code",
    redirect_uri: `${process.env.NOTION_REDIRECT_URI}`,
    code,
  };

  try {
    // Send the request
    const { data } = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      body,
      {
        headers,
      }
    );

    // Send the response

    // Set cookies
    res.cookie("access_token", data.access_token);

    return res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

app.use(express.static("public"));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
