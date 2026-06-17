const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:5057/swagger/v1/swagger.json');
    const json = await res.json();
    console.log(JSON.stringify(json.paths['/api/Camera'], null, 2));
    console.log(JSON.stringify(json.components.schemas['Camera'], null, 2));
    console.log(JSON.stringify(json.components.schemas['CameraListResponse'], null, 2));
    console.log(JSON.stringify(json.components.schemas['PaginatedResultOfCameraDto'], null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
