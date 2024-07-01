const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/api/hello', async (req, res) => {
    const visitorName = req.query.visitor_name || 'Guest';
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // Get location information based on IP address
        const geoResponse = await axios.get(`https://ipapi.co/json/`);
        const { city, region, latitude, longitude } = geoResponse.data;

        // Validate if we have latitude and longitude
        if (!latitude || !longitude) {
            throw new Error('Invalid latitude or longitude data');
        }

        // Get weather information
        const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
            params: {
                latitude,
                longitude,
                current_weather: true
            }
        });

        const temperature = weatherResponse.data.current_weather.temperature;

        // Construct the response
        const response = {
            client_ip: clientIp,
            location: city || region || 'Unknown',
            greeting: `Hello, ${visitorName}!, the temperature is ${temperature} degrees Celsius in ${city || region || 'your location'}`
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving location or weather information');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
