const API_BASE = 'https://api.talentprotocol.com/api/v2';
const API_KEY = process.env.TALENT_PROTOCOL_API_KEY!;

export async function getPassportByTwitterUsername(username: string): Promise<Passport | null> {
    
    const headers = {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Origin': 'https://app.talentprotocol.com',
        'Referer': 'https://app.talentprotocol.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
    };

    
    try {

        console.log('🔍 Searching for username:', username);
        console.log('🔑 Using API Key:', API_KEY); 

        const response = await fetch(
            `${API_BASE}/passports?filter[twitter]=${username}`,
            { headers }
        );

        console.log('📡 Initial API Response:', {
            status: response.status,
            ok: response.ok
        });

        if (!response.ok) return null;

        const data = await response.json();
        console.log('📦 Passports data:', data);
        const passports = data.passports;

        if (passports && passports.length > 0) {
            // Get full passport data
            const passportId = passports[0].passport_id;
            const fullPassport = await fetch(
                `${API_BASE}/passports/${passportId}`,
                { headers }
            );

            if (!fullPassport.ok) {
                throw new Error(`API error: ${fullPassport.status}`);
            }

            const { passport } = await fullPassport.json();
            return passport;
        }

        return null;
    } catch (error) {
        console.error('❌ Error fetching passport:', error);        
        return null;
    }
}