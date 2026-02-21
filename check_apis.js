const fs = require('fs');

// Read the base list of APIs
let apiList = [];
try {
  apiList = JSON.parse(fs.readFileSync('api_list.json', 'utf-8'));
} catch (e) {
  console.error("Error: Please create api_list.json with your API array.");
  process.exit(1);
}

const checkApi = async (api) => {
  const startTime = Date.now();
  try {
    // 10 second timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(api.url, { 
      signal: controller.signal,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (WhatsApp Bot API Checker)' }
    });
    
    clearTimeout(timeoutId);
    const ping = Date.now() - startTime;
    
    // Status 200-499 means the server responded (Even 401/403 means the host is up and active!)
    const isActive = response.status >= 200 && response.status < 500;

    return {
      ...api,
      status: isActive ? 'Active' : 'Offline',
      ping: `${ping} ms`
    };
  } catch (error) {
    return {
      ...api,
      status: 'Offline',
      ping: error.name === 'AbortError' ? 'Timeout' : 'Error'
    };
  }
};

const run = async () => {
  console.log('Starting API checks...');
  const results = [];
  
  for (const api of apiList) {
    console.log(`Checking ping for ${api.name}...`);
    const result = await checkApi(api);
    results.push(result);
  }

  // Save the result with Ping & Status to data.json
  fs.writeFileSync('data.json', JSON.stringify(results, null, 2));
  console.log('Successfully updated data.json');
};

run();
