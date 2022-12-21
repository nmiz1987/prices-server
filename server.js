import express from "express";
import cors from "cors";
import shufersalRouter from "./routes/shufersal.js";

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const port = process.env.PORT || 5000;

app.use("/shufersal", shufersalRouter);

app.get("/", async (req, res) => {
	try {
		return res
			.status(200)
			.json({
				shufersal: "https://busy-rose-bandicoot-tutu.cyclic.app/shufersal",
			});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

app.listen(port, () => {
	console.log(`Server Started at port ${port}`);
});
