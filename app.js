const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const apikey = 'b4791dd711064c538d4428543c177a03'
const port = 5000 
const axios = require('axios');
const weatherapi = '48d842f5079975e8e128d0bf974a1528'

const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(apikey);

app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


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


app.get('/trends', (req,res)=>{
   
    (async () => {
        const browser = await puppeteer.launch({headless:true});
        const page = await browser.newPage();
        await page.goto('https://trendlistz.com/india');
        
        await page.screenshot({path: 'twitter.png'});
        
        var posts = await page.evaluate(() => {
            var x = document.querySelectorAll(".trend-item");
            var obj = [];
            Array.from(x).forEach(function (element) { 
                try{
                var tweets = element.querySelector(".trend-item__content .term").textContent
                var url = element.querySelector(".trend-item__content .term a").href
                var count = element.querySelector(".trend-item__content .meta-info .label").textContent
                
                var tweeter = {
                    "Tweet" : tweets.trim(),
                    "url" : url.trim(),
                    "count" : count.trim()
                }
                obj.push(tweeter)
            }catch(error){}

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
                        "wind": response.data.wind,
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