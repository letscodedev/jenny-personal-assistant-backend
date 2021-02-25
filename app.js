const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const bodyParser = require('body-parser')

const app = express();
const apikey = 'b4791dd711064c538d4428543c177a03'
const weatherapi = '48d842f5079975e8e128d0bf974a1528'
const port = 5000 

const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(apikey);

const sessionId = uuid.v4();

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

app.post('/send-msg',(req,res)=>{
    console.log(req.body.message)
    callDialogflowAgentClient(req.body.message).then(data=>{
        res.send({reply:data})
    })
})

async function callDialogflowAgentClient(msg,projectId = 'jenny-bot-ee9g') {
    const sessionClient = new dialogflow.SessionsClient({
      keyFilename : "F:/Personal Assistant - LY/Final Project/jenny-personal-assistant-backend/jenny-bot-ee9g-c95f55784aad.json"
    });
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: msg,
          languageCode: 'en-US',
        },
      },
    };
    const responses = await sessionClient.detectIntent(request);
    console.log('Detected intent');
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

app.get('/news', function (req, res) {
    newsapi.v2.topHeadlines({
        q: 'trump',
        category: 'politics',
        language: 'en',
        country: 'us'
    })
    .then(response => {
        var news = []
        response.articles.forEach(newsdata =>{
            var obj = {
                "news_title" : newsdata.title,
                "news_url" : newsdata.url
            }
            news.push(obj)
        })
        res.send(news)
    });
})

app.get('/trends', (req, res)=>{
    (async () => {
        const browser = await puppeteer.launch({headless:true});
        const page = await browser.newPage();
        await page.goto('https://trendlistz.com/india', {waitUntil: 'load', timeout: 0});
        
        await page.screenshot({path: 'twitter.png'});
        
        var posts = await page.evaluate(() => {
            var x = document.querySelectorAll(".trend-item");
            var obj = [];
            Array.from(x).forEach(function (element) { 
                try{
                var tweets = element.querySelector(".trend-item__content .term").textContent
                var url = element.querySelector(".trend-item__content .term a").href
                var count = element.querySelector(".trend-item__content .meta-info .label").textContent
                var twitter = {
                    "tweet" : tweets.trim(),
                    "url" : url.trim(),
                    "count" : count.trim()
                }
                obj.push(twitter)
            }catch(error){
                console.log(error);
            }
            });
            console.log(obj) 
            return obj; 
        })
        res.send(posts)
    })();
    
})

app.get('/weather',(req,res)=>{
    axios.get('https://ipinfo.io/')
        .then(response => {
            var cityname = response.data.city;
            var state = response.data.region;
                axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${cityname}&appid=${weatherapi}`)
                .then(response => {
                    const weatherdata = {
                        "temparature": celcius = Math.round(response.data.main.temp - 273.15),
                        "humidity": response.data.main.humidity,
                        "wind": response.data.wind.speed,
                        "icon": response.data.weather[0].icon,
                        "city": cityname,
                        "state": state
                    }
                    res.send(weatherdata)
                })
                .catch(error => {
                    console.log(error);
                });
        })
        .catch(error => {
            console.log(error);
        });
})

app.listen(port, ()=>{
    console.log("Listening on port 5000")
})