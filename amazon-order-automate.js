const puppeteer = require("puppeteer");
var cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");

cloudinary.config({
  cloud_name: "dz86kvfjk",
  api_key: "678946972176869",
  api_secret: "E7xb1nmDA-Y9GIlUwRcr6dCHB88",
});

(async () => {
  var itemsToOrder = [
    "Amazon Echo (3rd generation) | Smart speaker with Alexa, Charcoal Fabric",
    "Kenwood kMix Stand Mixer for Baking, Stylish Kitchen Mixer with K-beater, Dough Hook and Whisk, 5 Litre Glass Bowl",
  ];
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto("https://clone-87aae.web.app/");

  await page.evaluate((itemsToOrder) => {
    try {
      var productElement = document.querySelectorAll(".product");
      Array.from(productElement).forEach(function (element) {
        var productName = element.querySelector(".product__info p:first-child")
          .textContent;

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

  const basket = "#root > div > div.header > div.header__nav > a:nth-child(4)";
  await page.click(basket);

  var total = await page.$eval(
    "#root > div > div.checkout > div.checkout__right > div > p > strong",
    (ele) => ele.innerHTML
  );
  console.log(total);
  await page.waitFor(5000);

  await page.screenshot({ path: "example.png", fullPage: true });
  cloudinary.uploader.upload("example.png", function (error, result) {
    console.log(result, error);
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
    to: "meet0619@gmail.com",
    subject: `Your Amazon Car Products`,
    html: `<p><h1>Your Order Pricr ${total}</h1><br>${itemsToOrder}</p>`,
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
      //res.status(404).json("Error in sending mail!");
    } else {
      console.log(info);
      //res.status(200).json("Mail sent!");
    }
  });
})();
