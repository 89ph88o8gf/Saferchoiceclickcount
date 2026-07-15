const express = require("express");
const cookieParser = require("cookie-parser");
const { createClient } = require("redis");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cookieParser());


const redis = createClient({
    url: process.env.REDIS_URL
});


redis.on("error", (err) => {
    console.log("Redis error:", err);
});


async function start() {
    await redis.connect();

    console.log("Redis connected");


    app.get("/download", async (req, res) => {

        let deviceId = req.cookies.safer_device;


        // Ako je prvi put otvorio link
        if (!deviceId) {

            deviceId = uuidv4();


            res.cookie(
                "safer_device",
                deviceId,
                {
                    maxAge: 1000 * 60 * 60 * 24 * 365,
                    httpOnly: true
                }
            );


            // proveri da li postoji
            const exists = await redis.sIsMember(
                "download_devices",
                deviceId
            );


            if (!exists) {

                await redis.sAdd(
                    "download_devices",
                    deviceId
                );


                await redis.incr(
                    "total_download_clicks"
                );

            }

        }


        // redirekcija na Google Play
        res.redirect(
            "https://play.google.com/store/apps/details?id=com.saferchoice.android"
        );

    });



    // statistika

    app.get("/stats", async (req,res)=>{


        const total = await redis.get(
            "total_download_clicks"
        );


        res.json({

            uniqueClicks: Number(total || 0)

        });


    });



    app.listen(
        process.env.PORT || 3000,
        ()=>{
            console.log(
                "Server started"
            );
        }
    );

}


start();
