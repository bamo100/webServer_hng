const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Replace with your actual ipgeolocation.io API key
const apiKey = '4aab3fb8a0704b13a31b86f08a0f7802';

app.get('/api/hello', async (req, res) => {
    const visitorName = req.query.visitor_name || 'Guest';
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // For testing purposes, use a known valid public IP
        const testingIp = '102.89.44.217';  // Google's public DNS IP
        //const ipToUse = clientIp.includes('127.0.0.1') || clientIp.includes('::1') ? testingIp : clientIp;
        console.log(`Client IP: ${clientIp}`);

        // Get location information based on IP address using ipgeolocation.io
        const geoResponse = await axios.get(`https://api.ipgeolocation.io/ipgeo`, {
            params: {
                apiKey,
                ip: clientIp
            }
        });
        console.log('Geo Response:', geoResponse.data);

        const { city, state_prov: region, latitude, longitude } = geoResponse.data;

        // Validate if we have latitude and longitude
        if (!latitude || !longitude) {
            console.error('Invalid latitude or longitude data:', geoResponse.data);
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
        console.log('Weather Response:', weatherResponse.data);

        const temperature = weatherResponse.data.current_weather.temperature;

        // Construct the response
        const response = {
            client_ip: clientIp,
            location: city || region || 'Unknown',
            greeting: `Hello, ${visitorName}!, the temperature is ${temperature} degrees Celsius in ${city || region || 'your location'}`
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Error retrieving location or weather information');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
