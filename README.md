# rms-redis

A redis tool using express to get/set/del redis using `NodeJs 20.14`

# Get started

## 1. Clone source code to your machine

```
cd rms-redis
npm install
```

## 2. Set up connection to your redis server

To update the Redis user, Redis password, Redis host, and Redis port, follow these steps: 1. Open the .env file located in the specified folder. 2. Locate the corresponding fields for Redis user, Redis password, Redis host, and Redis port. 3. Update the values of these fields with the desired information. 4. Save the changes made to the .env file.

## 3. Run it

```
npm run start
```

## 4. Usage

```
curl -X POST -H "Content-Type: application/json" -d '{"key":"key1", "value":"value1"}' http://localhost:3000/set
curl -X GET http://localhost:3000/{pattern}
curl -X DELETE http://localhost:3000/{key}
curl -X POST -H "Content-Type: application/json" -d '{"keys" : ["key1", "key2"]'} http://localhost:3000'
```

or access to `http://localhost:3000/api-docs` to use the UI
