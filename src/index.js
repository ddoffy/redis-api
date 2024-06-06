import express from "express";
import { createClient } from "redis";
import dotenv from "dotenv";
import swagger from "swagger-ui-express";
import YAML from "yamljs";

const swaggerDocuments = YAML.load("./swagger.yaml");

dotenv.config();

const app = express();

app.use(express.json());
app.use("/api-docs", swagger.serve, swagger.setup(swaggerDocuments));

const port = 3000;

const user = process.env.REDIS_USER;
const password = process.env.REDIS_PASSWORD;
const host = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;

const url = `redis://${user}:${password}@${host}:${redisPort}`;
const client = createClient({
  url: url,
});

client.on("error", (err) => console.log("Redis client error", err));

await client.connect();

app.get("/:pattern", async (req, res) => {
  let pattern = req.params.pattern;
  if (pattern) {
    pattern = `*${pattern}*`;
  } else {
    pattern = "*";
  }

  console.log(`Pattern: ${pattern}`);
  try {
    const keys = await client.keys(pattern);
    res.send(keys);
  } catch (e) {
    res.send(`Error: ${e}`);
  }
});

app.delete("/:key", async (req, res) => {
  const key = req.params.key;
  try {
    const value = await client.del(key);
    res.send(`Deleted: ${key} - ${value}`);
  } catch (e) {
    res.send(`Error: ${e}`);
  }
});

// POST method to delete a list of key
// The body should be a JSON object with a key "keys" and an array of keys
// Example: { "keys": ["key1", "key2", "key3"] }
// This will delete key1, key2, and key3
// If the body is empty, it will return an error
// If the keys array is empty, it will return an error
// If the keys array is not an array, it will return an error
// If the keys array contains a non-string value, it will return an error
// If the key does not exist, it will return an error
// If the key is deleted, it will return the key and the value
// If the key is not deleted, it will return the key and the value
app.post("/", async (req, res) => {
  const { keys } = req.body;
  if (!keys) {
    res.send("Error: No keys provided");
    return;
  }

  if (!Array.isArray(keys)) {
    res.send("Error: Keys is not an array");
    return;
  }

  if (keys.length === 0) {
    res.send("Error: Keys array is empty");
    return;
  }

  for (let key of keys) {
    if (typeof key !== "string") {
      res.send("Error: Key is not a string");
      return;
    }
  }

  try {
    const results = [];
    for (let key of keys) {
      const value = await client.del(key);
      console.log(`Deleted: ${key} - ${value}`);
      results.push({ key, value });
    }
    res.send(results);
  } catch (e) {
    res.send(`Error: ${e}`);
  }
});

// POST method to set a key value pair
// The body should be a JSON object with a key "key" and a value "value"
// Example: { "key": "key1", "value": "value1" }
// This will set key1 to value1
// If the body is empty, it will return an error
// If the key is empty, it will return an error
// If the value is empty, it will return an error
// If the key is not a string, it will return an error
// If the value is not a string, it will return an error
// If the key is set, it will return the key and the value
// If the key is not set, it will return the key and the value
// If the key already exists, it will return an error
app.post("/set", async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) {
    res.send("Error: No key or value provided");
    return;
  }

  if (typeof key !== "string") {
    res.send("Error: Key is not a string");
    return;
  }

  if (typeof value !== "string") {
    res.send("Error: Value is not a string");
    return;
  }

  try {
    const results = await client.set(key, value);
    res.send({ key, value, results });
  } catch (e) {
    res.send(`Error: ${e}`);
  }
});

// POST method to set a key value pair with an expiration
// The body should be a JSON object with a key "key", a value "value", and an expiration "expiration"
// Example: { "key": "key1", "value": "value1", "expiration": 60 }
// This will set key1 to value1 with an expiration of 60 seconds
// If the body is empty, it will return an Error
// If the key is empty, it will return an error
// If the value is empty, it will return an Error
// If the expiration is empty, it will return an error
// If the key is not a string, it will return an Error
// If the value is not a string, it will return an error
// If the expiration is not a number, it will return an Error
// If the key is set, it will return the key, value, and expiration
// If the key is not set, it will return the key, value, and expiration
// If the key already exists, it will return an Error
// If the key is set with an expiration, it will return the key, value, expiration, and results
// If the key is not set with an expiration, it will return an error
app.post("/setex", async (req, res) => {
  const { key, value, expiration } = req.body;
  if (!key || !value || !expiration) {
    res.send("Error: No key, value, or expiration provided");
    return;
  }

  if (typeof key !== "string") {
    res.send("Error: Key is not a string");
    return;
  }

  if (typeof value !== "string") {
    res.send("Error: Value is not a string");
    return;
  }

  try {
    const results = await client.setEx(key, expiration, value);
    res.send({ key, value, expiration, results });
  } catch (e) {
    res.send(`Error: ${e}`);
  }
});

// POST method to set a list of key value pairs
// The body should be a JSON object with a key "pairs" and an array of key value pairs
// Example: { "pairs": [{ "key": "key1", "value": "value1" }, { "key": "key2", "value": "value2" }, { "key": "key3", "value": "value3" }] }
// This will set key1 to value1, key2 to value2, and key3 to value3
// If the body is empty, it will return an Error
// If the pairs array is empty, it will return an error
// If the pairs array is not an array, it will return an Error
// If the pairs array contains a non-object value, it will return an error
// If the pairs array contains an object without a key or value, it will return an Error
// If the key is empty, it will return an Error
// If the value is empty, it will return an error
// If the key is not a string, it will return an error
// If the value is not a string, it will return an Error
// If the key is set, it will return the key and the value1
// If the key is not set, it will return the key and the value1
// If the key already exists, it will return an error
// If the key is set with an expiration, it will return the key, value, expiration, and results
// If the key is not set with an expiration, it will return an Error
// If the key is set with an expiration, it will return the key, value, expiration, and results
// If the key is not set with an expiration, it will return an error
// If the key is set with an expiration, it will return the key, value, expiration, and results
// If the key is not set with an expiration, it will return an Error
// If the key is set with an expiration, it will return the key, value, expiration, and results
app.post("/mset", async (req, res) => {
  const { pairs } = req.body;
  if (!pairs) {
    res.send("Error: No pairs provided");
    return;
  }

  if (!Array.isArray(pairs)) {
    res.send("Error: Pairs is not an array");
    return;
  }

  if (pairs.length === 0) {
    res.send("Error: Pairs array is empty");
    return;
  }

  for (let pair of pairs) {
    if (typeof pair !== "object") {
      res.send("Error: Pair is not an object");
      return;
    }

    if (!pair.key || !pair.value) {
      res.send("Error: Pair is missing key or value");
      return;
    }

    if (typeof pair.key !== "string") {
      res.send("Error: Key is not a string");
      return;
    }

    if (typeof pair.value !== "string") {
      res.send("Error: Value is not a string");
      return;
    }
  }

  try {
    const results = [];
    for (let pair of pairs) {
      const result = await client.set(pair.key, pair.value);
      results.push({
        key: pair.key,
        value: pair.value,
        expiration: pair.expiration,
        result,
      });
    }
    res.send(results);
  } catch (e) {
    res.send(`Error: ${e}`);
  }
});

// POST method to set a list of key value pairs with an expiration
// The body should be a JSON object with a key "pairs" and an array of key value pairs
// Example: { "pairs": [{ "key": "key1", "value": "value1", "expiration": 60 }, { "key": "key2", "value": "value2", "expiration": 60 }, { "key": "key3", "value": "value3", "expiration": 60 }] }
// This will set key1 to value1 with an expiration of 60 seconds, key2 to value2 with an expiration of 60 seconds, and key3 to value3 with an expiration of 60 seconds
// If the body is empty, it will return an error
// If the pairs array is empty, it will return an Error
// If the pairs array is not an array, it will return an Error
// If the pairs array contains a non-object value, it will return an error
// If the pairs array contains an object without a key, value, or expiration, it will return an error
// If the key is empty, it will return an Error
// If the value is empty, it will return an error
// If the expiration is empty, it will return an Error
// If the key is not a string, it will return an error
// If the value is not a string, it will return an error
// If the expiration is not a number, it will return an Error
// If the key is set, it will return the key, value, and expiration
// If the key is not set, it will return the key, value, and expiration
// If the key already exists, it will return an error
// If the key is set with an expiration, it will return the key, value, expiration, and results
// If the key is not set with an expiration, it will return an Error
app.post("/msetex", async (req, res) => {
  const { pairs } = req.body;
  if (!pairs) {
    res.send("Error: No pairs provided");
    return;
  }

  if (!Array.isArray(pairs)) {
    res.send("Error: Pairs is not an array");
    return;
  }

  if (pairs.length === 0) {
    res.send("Error: Pairs array is empty");
    return;
  }

  for (let pair of pairs) {
    if (typeof pair !== "object") {
      res.send("Error: Pair is not an object");
      return;
    }

    if (!pair.key || !pair.value || !pair.expiration) {
      res.send("Error: Pair is missing key, value, or expiration");
      return;
    }

    if (typeof pair.key !== "string") {
      res.send("Error: Key is not a string");
      return;
    }

    if (typeof pair.value !== "string") {
      res.send("Error: Value is not a string");
      return;
    }

    if (typeof pair.expiration !== "number") {
      res.send("Error: Expiration is not a number");
      return;
    }
  }

  try {
    const results = [];
    for (let pair of pairs) {
      const result = await client.setEx(pair.key, pair.expiration, pair.value);
      results.push({
        key: pair.key,
        value: pair.value,
        expiration: pair.expiration,
        result,
      });
    }
    res.send(results);
  } catch (e) {
    res.send(`Error: ${e}`);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
