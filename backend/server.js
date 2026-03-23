import app from "./src/app.js";
import connectToDb from "./src/config/database.js";
import "dotenv/config";

const PORT = process.env.PORT || 3000;

connectToDb().catch((err) => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
