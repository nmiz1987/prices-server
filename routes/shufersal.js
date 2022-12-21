import { createWriteStream, createReadStream } from "fs";
import { get } from "http";
import zlib from "zlib";
import { parseString } from "xml2js";
import { readFile, writeFile, unlink } from "fs/promises";
import axios from "axios";
import cheerio from "cheerio";
import express from "express";
const router = express.Router();

let fileUrl = "";
const serverUrl =
	"http://prices.shufersal.co.il/FileObject/UpdateCategory?catID=2&storeId=135";

const getUrlFromServer = async () => {
	try {
		const res = await axios.get(serverUrl);
		const $ = cheerio.load(res.data);
		$(".webgrid-row-style", res.data).each(function () {
			fileUrl = $(this).find("a").attr("href");
			console.log("url: ", fileUrl);
		});
	} catch (error) {
		console.error(error);
	}
};

const downloadZip = async (url, downloadFileName) => {
	// make a new promise that will resolve when the zip file is downloaded
	return new Promise((resolve, reject) => {
		// create a file stream to write the downloaded zip file to
		const file = createWriteStream(downloadFileName);

		// make a request to the URL to download the zip file
		get(url, (response) => {
			// pipe the response data to the file stream
			response.pipe(file);

			// when the download is complete, resolve the promise
			file.on("finish", () => {
				console.log(`finish download file ${downloadFileName}`);
				file.close(resolve); // close the file stream and resolve the promise
			});
		}).on("error", (error) => {
			// handle any errors by rejecting the promise
			unlink(downloadFileName); // delete the file if there was an error
			reject(error);
		});
	});
};

const unzipFile = async (downloadFileName, unzipFileName, JSONfileName) => {
	// open the zip file as a readable stream
	try {
		// prepare streams
		let src = createReadStream(downloadFileName);
		let dest = createWriteStream(`./${unzipFileName}`);

		// extract the archive
		src.pipe(zlib.createGunzip()).pipe(dest);
		console.log(`unziped file ${downloadFileName} to ${unzipFileName}`);

		// callback on extract completion
		dest.on("close", async function () {
			if (typeof callback === "function") {
				callback();
			}

			console.log("staring to parse xml file to json");
			let xml = await readFile(
				new URL(`../${unzipFileName}`, import.meta.url),
				"utf-8"
			);
			parseString(xml, async function (err, result) {
				await writeFile(
					new URL(`../${JSONfileName}`, import.meta.url),
					JSON.stringify(result)
				);
			});
			console.log("finish parsing xml file to json");
		});
		let xml = await readFile(
			new URL(`../${JSONfileName}`, import.meta.url),
			"utf-8"
		);
		return JSON.parse(xml);
	} catch (err) {
		console.log(err);
	}
};

const cleanup = async (gzFIle, xmlFile) => {
	try {
		console.log("start cleanup");
		unlink(`${gzFIle}`); // delete the gz file
		unlink(`${xmlFile}`); // delete the xml file
		console.log("finish cleanup");
	} catch (err) {
		console.error(err);
	}
};

// Get all prices
export default router.get("/", async (req, res) => {
	try {
		const fileType = "fullPrices";
		const downloadFileName = `${fileType}.gz`;
		const xmlFileName = `${fileType}.xml`;
		const JSONfileName = `${fileType}.json`;
		await getUrlFromServer();
		await downloadZip(fileUrl, downloadFileName);
		let a = await unzipFile(downloadFileName, xmlFileName, JSONfileName);
		// setTimeout(async () => {
		// cleanup(downloadFileName, unzipFileName);
		// }, 8000);
		return res.status(200).json(a);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// module.exports = router;
