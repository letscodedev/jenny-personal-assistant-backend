const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");
const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");
const bodyParser = require("body-parser");
const { WebhookClient } = require("dialogflow-fulfillment");
const puppeteerextra = require("puppeteer-extra");
const chalk = require("chalk");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const nodemailer = require("nodemailer");
// const user = "meet0619@gmail.com";
// const password = "first blood";

const app = express();
const newsapikey = "b4791dd711064c538d4428543c177a03";
const weatherapi = "48d842f5079975e8e128d0bf974a1528";
const port = process.env.PORT || 5000;
var cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dz86kvfjk",
  api_key: "678946972176869",
  api_secret: "E7xb1nmDA-Y9GIlUwRcr6dCHB88",
});

var automateResult;

var amazonResult;

const NewsAPI = require("newsapi");
// const newsapi = new NewsAPI(apikey);

const sessionId = uuid.v4();

var path = require("path");
var file = path.resolve(__dirname, "jenny-bot-ee9g-c95f55784aad.json");

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.status(200).JSON("API Working");
});

app.post("/send-msg", (req, res) => {
  console.log(req.body.message);
  callDialogflowAgentClient(req.body.message)
    .then((data) => {
      res.send({ reply: data });
    })
    .catch((error) => {
      console.log(error);
    });
});

async function callDialogflowAgentClient(msg, projectId = "jenny-bot-ee9g") {
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: file,
  });
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: msg,
        languageCode: "en-US",
      },
    },
  };
  const responses = await sessionClient.detectIntent(request);
  console.log("Detected intent");
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
  } else {
    console.log(`  No intent matched.`);
  }
  return result.fulfillmentText;
}

app.get("/news", (req, res) => {
  newsurl = `http://newsapi.org/v2/top-headlines?country=in&apiKey=${newsapikey}`;
  var newsobj = [];
  axios
    .get(newsurl)
    .then((response) => {
      Articles = response.data.articles;
      //console.log(Articles)
      Articles.forEach((article) => {
        json_obj = { NewsTitle: article.title, NewsUrl: article.url };
        newsobj.push(json_obj);
      });
      res.send(newsobj);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/trends", (req, res) => {
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("https://trendlistz.com/india", {
      waitUntil: "load",
      timeout: 0,
    });

    await page.screenshot({ path: "twitter.png" });

    var posts = await page.evaluate(() => {
      var x = document.querySelectorAll(".trend-item");
      var obj = [];
      Array.from(x).forEach(function (element) {
        try {
          var tweets = element.querySelector(".trend-item__content .term")
            .textContent;
          var url = element.querySelector(".trend-item__content .term a").href;
          var count = element.querySelector(
            ".trend-item__content .meta-info .label"
          ).textContent;
          var twitter = {
            tweet: tweets.trim(),
            url: url.trim(),
            count: count.trim(),
          };
          obj.push(twitter);
        } catch (error) {
          console.log(error);
        }
      });
      console.log(obj);
      return obj;
    });
    res.send(posts);
    browser.close();
  })();
});

app.get("/score", (req, res) => {
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
      defaultViewport: null,
    });
    const page = await browser.newPage();
    await page.goto("https://www.cricbuzz.com/cricket-match/live-scores");
    await page.click("#live-tab");

    var url1 = await page.evaluate(() => {
      try {
        var x = document.querySelector(".cb-rank-hdr div:first-child h3 a")
          .href;
        console.log(x);
        const status = {
          match_status: "Live",
          match_url: x,
        };
        return status;
      } catch (e) {
        console.log("no live match");
        return 0;
      }
    });

    if (url1 === 0) {
      await page.click("#recent-tab");
      url1 = await page.evaluate(() => {
        try {
          var x = document.querySelector(".cb-rank-hdr div:first-child h3 a")
            .href;
          console.log(x);
          const status = {
            match_status: "Stumps",
            match_url: x,
          };
          return status;
        } catch (e) {
          console.log("no live match");
          return 0;
        }
      });
    }
    console.log(url1);
    await browser.close();
    res.send(url1);
  })();
});

app.post("/weather", (req, res) => {
  console.log("latitite", req.body.latitute);
  console.log("long", req.body.longitude);
  axios
    .get(
      `http://api.openweathermap.org/data/2.5/weather/?lat=${req.body.latitute}&lon=${req.body.longitude}&units=metric&APPID=${weatherapi}`
    )
    .then((response) => {
      const weatherdata = {
        temparature: response.data.main.temp,
        humidity: response.data.main.humidity,
        wind: response.data.wind.speed,
        icon: response.data.weather[0].icon,
        city: response.data.name,
      };
      res.send(weatherdata);
    })
    .catch((error) => {
      console.log(error);
    });
});
// .catch((error) => {
//   console.log(error);
// });
//});

app.post("/command", (request, response) => {
  console.log("Command API is triggered!");
  dialogflowFulfillment(request, response);
});

const dialogflowFulfillment = async (request, response) => {
  console.log("DialogFlow API is triggered!");
  const agent = new WebhookClient({ request, response });

  function sayHello(agent) {
    agent.add("Hey there!");
  }

  async function carRent(agent) {
    const { source, destination, carName } = agent.parameters;
    console.log("Function triggered 999");
    agent.add("Processing Please wait");
    // agent.add("Test")
    console.log(source);
    console.log(destination);
    console.log(carName);
    automateCarRent(source, destination, carName);
    // console.log(result)
    // await agent.add(JSON.stringify(result))
  }

  async function amazon_order(agent) {
    console.log("Inside Amazon Order Function");
    agent.add("Amazon service is being processed");
    amazonAutomate();
  }

  function reply(agent) {
    console.log(automateResult);
    agent.add(JSON.stringify(automateResult));
  }

  function reply_amazon(agent) {
    console.log("Reply from Amazon");
    console.log(amazonResult);
    agent.add(amazonResult);
  }

  async function gmail(agent) {
    console.log("Gmail Services in use");
    const { email, text, subject } = agent.parameters;
    console.log(email);
    console.log(subject);
    console.log(text);
    automateGmailService(email, subject, text);
  }

  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", sayHello);
  intentMap.set("Car Rent Intent", carRent);
  intentMap.set("Reply", reply);
  intentMap.set("Gmail", gmail);
  intentMap.set("Amazon-Reply", reply_amazon);
  intentMap.set("Amazon-Order", amazon_order);
  agent.handleRequest(intentMap);
};

async function amazonAutomate() {
  console.log("Devarsh bekar hain");
  // app.get("/amazon", (req, res) => {
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
      defaultViewport: null,
    });
    const page = await browser.newPage();

    await page.goto("https://clone-87aae.web.app/");

    await page.waitForSelector(".product");

    var amazonposts = await page.evaluate(() => {
      var x = document.querySelectorAll(".product");
      var amazon_products = [];
      Array.from(x).forEach(function (element, index) {
        try {
          // console.log(element);
          var heading = element.querySelector(".product__info p:first-child")
            .textContent;
          var price = element.querySelector(
            ".product__info .product__price strong"
          ).textContent;
          var image = element.querySelector("img").src;
          //console.log(image);

          var products_info = {
            id: index,
            Heading: heading,
            Price: price,
            Image_src: image,
          };
          amazon_products.push(products_info);
        } catch (error) {
          console.log(error);
        }
      });
      return amazon_products;
    });
    console.log(amazonposts);
    console.log("Hello Meet!", amazonResult);
    amazonResult = JSON.stringify(amazonposts);
    // res.send(amazonposts);
    console.log("devarsh here ", amazonResult);
    browser.close();
  })();
}

app.post("/myamazonorder", (req, res) => {
  (async () => {
    var orderscreenshot = "";
    const emailaddress = req.body.email;
    console.log("email ", emailaddress);
    var itemsToOrder = [
      "Amazon Echo (3rd generation) | Smart speaker with Alexa, Charcoal Fabric",
      "Kenwood kMix Stand Mixer for Baking, Stylish Kitchen Mixer with K-beater, Dough Hook and Whisk, 5 Litre Glass Bowl",
    ];
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
      defaultViewport: null,
    });
    const page = await browser.newPage();
    await page.goto("https://clone-87aae.web.app/");

    await page.evaluate((itemsToOrder) => {
      try {
        var productElement = document.querySelectorAll(".product");
        Array.from(productElement).forEach(function (element) {
          var productName = element.querySelector(
            ".product__info p:first-child"
          ).textContent;

          itemsToOrder.forEach((item) => {
            if (productName === item) {
              element.querySelector("button").click();
            }
          });
        });
      } catch (e) {
        console.log(e);
      }
    }, itemsToOrder);

    const basket =
      "#root > div > div.header > div.header__nav > a:nth-child(4)";
    await page.click(basket);

    var total = await page.$eval(
      "#root > div > div.checkout > div.checkout__right > div > p > strong",
      (ele) => ele.innerHTML
    );
    console.log(total);
    await page.waitFor(5000);

    await page.screenshot({ path: "example.png", fullPage: true });
    await cloudinary.uploader.upload("example.png", function (error, result) {
      console.log(result.url);
      orderscreenshot = result.url;
    });

    await browser.close();

    var transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: "jennypersonalassistant@gmail.com",
        pass: "mdh@12345",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: "Jenny Personal Assistant <jennypersonalassistant@gmail.com>",
      to: emailaddress,
      subject: `Your Amazon Order Confirmation`,
      html: `<p><h1>Your Order Price ${total}</h1><br>
      <ol>
      <li>${itemsToOrder[0]}</li>
      <li>${itemsToOrder[1]}</li>
      </ol>  
    </p>`,
    };
    var datatosend = {
      image_url: orderscreenshot,
      msg:
        "Congratulations!! Your Order has been placed. Please check your mailbox for order details.",
    };
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
        res.status(404).send("Error in sending mail!");
      } else {
        console.log(info);
        console.log(datatosend);
        res.status(200).json(datatosend);
      }
    });
  })();
});

async function automateGmailService(email, subject, text) {
  (async () => {
    puppeteerextra.use(pluginStealth());
    const browser = await puppeteerextra.launch({
      headless: true,
      defaultViewport: null,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto(
      "https://accounts.google.com/AccountChooser?service=mail&continue=https://mail.google.com/mail/"
    );

    await page.waitForSelector(`input[type='email']`);
    await page.type(`input[type='email']`, user);
    await page.keyboard.press("Enter");

    await page.waitForNavigation(["networkidle0", "load", "domcontentloaded"]);
    await page.waitFor(3550);
    await page.waitForSelector(`input[type='password']`);
    await page.type(`input[type='password']`, password);
    await page.keyboard.press("Enter");
    await page.waitForNavigation(["networkidle0", "load", "domcontentloaded"]);

    console.log(chalk.whiteBright.inverse("Logged in succesfully."));

    await page.waitForSelector(".T-I.T-I-KE.L3");
    console.log("compose");
    await page.click(".T-I.T-I-KE.L3");

    await page.waitForSelector(".aoD.hl");
    await page.type(".aoD.hl", email);
    await page.keyboard.press("Enter");
    await page.waitForSelector("input[name='subjectbox']");
    await page.type("input[name='subjectbox']", subject);

    await page.waitForSelector(".Am.Al.editable.LW-avf.tS-tW");
    await page.type(".Am.Al.editable.LW-avf.tS-tW", text);

    await page.waitForSelector(".gU.Up");
    await page.click(".gU.Up");

    await page.waitFor(3500);

    console.log("Mail Sent finally");
    browser.close();
  })();
}
async function automateCarRent(source, destination, carName) {
  (async () => {
    let email = "babloojasbati15@gmail.com";
    let password = "babloowashere";
    let carSelect = carName;
    let pickUpLocation = source;
    let dropLocation = destination;
    let name = "Babloo Jasbati";
    let mobile = "9999999999";
    let startDate = "29032021";
    let startTime = "0100PM";
    let endDate = "30032021";
    let endTime = "0500AM";

    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: ["--no-sandbox"],
    });
    console.log("hello");
    const page = await browser.newPage();
    await page.goto("https://penny-car-rent.web.app");

    let loginEmailInput =
      "#root > div > div > div > div:nth-child(1) > input[type=text]";
    await page.click(loginEmailInput);
    await page.keyboard.type(email);

    let loginPasswordInput =
      "#root > div > div > div > div:nth-child(2) > input[type=password]";
    await page.click(loginPasswordInput);
    await page.keyboard.type(password);
    // await page.waitFor(1000);
    let loginButton = "#root > div > div > div > div:nth-child(3) > button";
    await page.click(loginButton);

    await page.waitForSelector("#inputState");
    await page.select("#inputState", carSelect);
    // await page.waitFor(2000);

    await page.click("#source");
    await page.keyboard.type(pickUpLocation);
    await page.click("#destination");
    await page.keyboard.type(dropLocation);

    await page.click("#example-datetime-local-input1");
    await page.keyboard.type(startDate);
    await page.keyboard.press("Tab");
    page.keyboard.type(startTime);

    await page.click("#example-datetime-local-input2");
    await page.keyboard.type(endDate);
    await page.keyboard.press("Tab");
    page.keyboard.type(endTime);

    await page.waitForSelector("#name");
    await page.click("#name");
    await page.keyboard.type(name);

    await page.click("#email");
    await page.keyboard.type(email);

    await page.click("#mobile");
    await page.keyboard.type(mobile);

    await page.click(
      "#root > div > div > div.content.container.col-md-6 > form > div:nth-child(6) > div > a > button"
    );
    // await page.waitFor(2000);
    await page.waitForSelector(
      "#root > div > div > div.content.container.col-md-6 > table > tr:nth-child(1) > td:nth-child(2)"
    );

    // await page.pdf({
    //     format: 'A4',
    //     path: `${__dirname}/confirmation.pdf`
    // })

    const data = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll("table tr td"));
      return tds.map((td) => td.innerText);
    });

    var ourDetail = {
      bookingId: data[1],
      carName: carName,
      CarNumber: data[3],
      Start: pickUpLocation,
      PickupTime: data[5],
      PickupLocation: data[7],
      Stop: dropLocation,
      DropTime: data[9],
    };
    // for (let i = 1; i < data.length; i += 2) {
    //     ourDetail.push(data[i])
    // }
    console.log(ourDetail);
    automateResult = ourDetail;
    // const datas = {
    //     message: 'reply'
    // };
    // axios
    // .post("https://jenny-backend.herokuapp.com/send-msg", datas)
    // .then(response => {
    //     console.log('AXIOS CALL')
    // })
    // .catch(error => {
    //     console.log("Error: ", error);
    // });
    await page.screenshot({ path: "example.png" });
    await browser.close();
    //return(ourDetail)
  })();
}

app.listen(port, () => {
  console.log("Listening on port 5000");
});
