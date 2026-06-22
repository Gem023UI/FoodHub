const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found in environment");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    console.log("Databases on cluster:");
    dbs.databases.forEach((d) => console.log(` - ${d.name} (${d.sizeOnDisk} bytes)`));

    // If foodhub exists, list its collections
    const target = "foodhub";
    if (dbs.databases.some((d) => d.name === target)) {
      const cols = await client.db(target).listCollections().toArray();
      console.log(`\nCollections in '${target}':`);
      cols.forEach((c) => console.log(` - ${c.name}`));
    } else {
      console.log(`\nDatabase '${target}' not found in the cluster list.`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
