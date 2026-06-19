const https = require('https');

https.get('https://giaothong.hochiminhcity.gov.vn/cdn/vietbandomapapi/2.0.1/vietbandomapsapi.js', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const matches = data.match(/http[s]?:\/\/[^\"\']+/g);
        if (matches) {
            const unique = [...new Set(matches)];
            unique.forEach(m => {
                if (m.toLowerCase().includes('tile') || m.toLowerCase().includes('map')) {
                    console.log(m);
                }
            });
        } else {
            console.log("No matches found.");
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
