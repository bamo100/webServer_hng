const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;
const ipinfoApiKey = '352ad8bf8693ae';

function isLocalIp(ip) {
    return ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
}

app.get('/api/hello', async (req, res) => {
    const visitorName = req.query.visitor_name || 'Guest';
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    console.log(`Client IP: ${clientIp}`);

    // Handle local IPs
    if (isLocalIp(clientIp)) {
        console.log('Local IP detected, using fallback IP');
        clientIp = '102.89.44.217';  // Example fallback public IP (Google's DNS server)
    }

    try {
        // Get location information based on client's IP address
        const geoUrl = `https://ipinfo.io/${clientIp}?token=${ipinfoApiKey}`;
        // const geoUrl = 'https://ipinfo.io/102.89.44.217?token=352ad8bf8693ae'
        console.log(`Geo URL: ${geoUrl}`);

        const geoResponse = await axios.get(geoUrl);
        console.log('Geo Response:', geoResponse.data);

        if (!geoResponse.data.loc) {
            throw new Error('Location data not available');
        }

        const [latitude, longitude] = geoResponse.data.loc.split(',');
        const city = geoResponse.data.city;
        const region = geoResponse.data.region;

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

        console.log('Weather Response:', weatherResponse.data);

        const temperature = weatherResponse.data.current_weather.temperature;

        // Construct the response
        const response = {
            client_ip: clientIp,
            location: city || region || 'Unknown',
            greeting: `Hello, ${visitorName}! The temperature is ${temperature} degrees Celsius in ${city || region || 'your location'}.`
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
