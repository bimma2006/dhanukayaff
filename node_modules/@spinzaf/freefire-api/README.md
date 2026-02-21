<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:1f2937,100:111827&height=180&section=header&text=Free%20Fire%20API&fontSize=48&fontColor=ffffff&animation=fadeIn" width="100%" alt="Free Fire API Hero" />
  <img src="https://dl.dir.freefiremobile.com/common/test/official/FF_SHORT_LOGO.PNG.png" width="120" alt="Free Fire Logo" />
</div>

# Free Fire API

A Node.js library to interact with Free Fire endpoints using Protobuf.

## Disclaimer
This project is **unofficial** and is not affiliated with Garena.

## Features
- Login and session management
- Search account by nickname
- Get player profile
- Get BR/CS stats
- Get equipped player items
- YAML-based configuration

## Installation
```bash
npm install @spinzaf/freefire-api
```

## Requirements
- Node.js 14+

## Quick Start
```js
const FreeFireAPI = require('@spinzaf/freefire-api');

async function main() {
  const api = new FreeFireAPI();

  // Auto login via config/credentials.yaml
  const players = await api.searchAccount('Spin');
  console.log(players);
}

main().catch(console.error);
```

## Configuration (Optional)

### 1. Credentials (`config/credentials.yaml`)
Used when calling `login()` without parameters.

```yaml
UID: "YOUR_UID"
PASSWORD: "YOUR_PASSWORD"
```

### 2. Core Settings (`config/settings.yaml`)
Primary source for internal constants: `AE`, `HEADERS`, `URLS`, `GARENA_CLIENT`.

```yaml
HEADERS_COMMON_RELEASE_VERSION: "OB52"
URL_MAJOR_LOGIN: "https://loginbp.ggblueshark.com/MajorLogin"
```

## API Reference

### `new FreeFireAPI()`
Creates a new API client instance.

### `api.login(uid?, password?)`
Optional account authentication (not required).

```js
await api.login('YOUR_UID', 'YOUR_PASSWORD');
```

Use this only if you want to login manually.  
Default provider credentials are already available, so calling `login()` is optional.

If parameters are omitted, the library reads credentials from `config/credentials.yaml`.

### `api.searchAccount(keyword)`
Searches accounts by nickname.

```js
const results = await api.searchAccount('Spin');
```

### `api.getPlayerProfile(uid)`
Fetches detailed player profile information.

```js
const profile = await api.getPlayerProfile('16207002');
```

### `api.getPlayerStats(uid, mode, matchType)`
Fetches player statistics.

- `mode`: `br` | `cs`
- `matchType`: `career` | `ranked` | `normal`

```js
const brCareer = await api.getPlayerStats('16207002', 'br', 'career');
const csRanked = await api.getPlayerStats('16207002', 'cs', 'ranked');
```

### `api.getPlayerItems(uid)`
Fetches currently equipped player items.

```js
const items = await api.getPlayerItems('16207002');
console.log(items);
```

Sample response:
```json
{
  "basic_info": {
    "accountid": "16207002",
    "nickname": "Spin",
    "level": 74,
    "region": "ID"
  },
  "items": {
    "outfit": [{ "id": 101001, "name": "Skull Mask" }],
    "weapons": {
      "shown_skins": [{ "id": 907001, "name": "AK47 - Blue Flame" }]
    },
    "skills": {
      "equipped": [{ "id": 123, "name": "Alok: Drop the Beat" }]
    },
    "pet": {
      "name": "Falco"
    }
  }
}
```

## Error Handling
Use `try/catch` for all async calls.

```js
try {
  const profile = await api.getPlayerProfile('16207002');
  console.log(profile);
} catch (err) {
  console.error('API error:', err.message);
}
```

## Testing
```bash
npm test
npm run test:login
npm run test:search
npm run test:profile
npm run test:stats
npm run test:items
npm run test:all
```

### Full Test Output Example
The following is a complete, readable example from `npm run test:all`:

```text
Running all tests sequentially...

-------------- login.js:
Loaded 27989 items into database.
Starting Login Test...
[i] No credentials provided, loading from config/credentials.yaml.
Login success!
Token: eyJhbGciOiJIUzI1NiIs...
OpenID: ee3fa75646052bbf713d9f7f3e0a5c81

-------------- search.js:
Loaded 27989 items into database.
Starting Search Test for 'folaa'...
[i] No credentials provided, loading from config/credentials.yaml.
Found 10 players.
Top Result: Folaa (UID: 16778836)
[1] Folaa - UID: 16778836 - LVL: 3
[2] FolAa_66 - UID: 1943283579 - LVL: 46
[3] Folaa_golgem - UID: 14576052221 - LVL: 6
[4] folaa_ji - UID: 9436868269 - LVL: 7
[5] Folaa- - UID: 2357144535 - LVL: 1
[6] FOLAA-khna9 - UID: 2359319137 - LVL: 1
[7] Folaa! - UID: 8638700824 - LVL: 7
[8] folaa!! - UID: 8341924255 - LVL: 17
[9] folaa..... - UID: 6973843243 - LVL: 2
[10] folaa***** - UID: 5824293752 - LVL: 5

-------------- profile.js:
Loaded 27989 items into database.
Starting Profile Test for UID: 12345678...
[i] No credentials provided, loading from config/credentials.yaml.

--- Basic Info ---
Nickname: FB:ㅤ@GMRemyX
Level: 68
EXP: 2327466
Region: SG
Likes: 3682188
Created At: 12/7/2017, 5:19:29 AM
Last Login: 2/19/2026, 6:02:53 PM

--- Pet Info ---
Pet Name: SiNo
Pet Level: 7

-------------- stats.js:
Loaded 27989 items into database.
Starting Stats Test for UID: 16207002...
Fetching BR Career...
[i] No credentials provided, loading from config/credentials.yaml.

--- BR Career ---
Solo: {"accountid":"16207002","gamesplayed":1055,"wins":88,"kills":2769,"detailedstats":{"deaths":967,"top10times":0,"topntimes":279,"distancetravelled":3224879,"survivaltime":458396,"revives":0,"highestkills":20,"damage":812652,"roadkills":47,"headshots":1453,"headshotkills":630,"knockdown":0,"pickups":58619}}
Duo: {"accountid":"16207002","gamesplayed":461,"wins":80,"kills":1383,"detailedstats":{"deaths":381,"top10times":0,"topntimes":144,"distancetravelled":1544324,"survivaltime":217132,"revives":98,"highestkills":22,"damage":487692,"roadkills":48,"headshots":960,"headshotkills":367,"knockdown":1320,"pickups":32130}}
Squad: {"accountid":"16207002","gamesplayed":6451,"wins":1225,"kills":16041,"detailedstats":{"deaths":5226,"top10times":0,"topntimes":2059,"distancetravelled":26527594,"survivaltime":3204309,"revives":1305,"highestkills":34,"damage":7241365,"roadkills":122,"headshots":12622,"headshotkills":3899,"knockdown":17564,"pickups":586395}}
Fetching BR Ranked...

--- BR Ranked ---
Solo: {"accountid":"16207002","gamesplayed":4,"wins":1,"kills":25,"detailedstats":{"deaths":3,"top10times":0,"topntimes":3,"distancetravelled":13591,"survivaltime":1857,"revives":0,"highestkills":15,"damage":6317,"roadkills":0,"headshots":19,"headshotkills":8,"knockdown":0,"pickups":483}}
Duo: {"accountid":"16207002","gamesplayed":3,"wins":1,"kills":8,"detailedstats":{"deaths":2,"top10times":0,"topntimes":2,"distancetravelled":14501,"survivaltime":1607,"revives":3,"highestkills":4,"damage":2561,"roadkills":0,"headshots":2,"headshotkills":0,"knockdown":10,"pickups":383}}
Squad: {"accountid":"16207002","gamesplayed":548,"wins":50,"kills":1520,"detailedstats":{"deaths":498,"top10times":0,"topntimes":74,"distancetravelled":1859691,"survivaltime":169414,"revives":57,"highestkills":21,"damage":672006,"roadkills":0,"headshots":1287,"headshotkills":392,"knockdown":1741,"pickups":47692}}
Fetching CS Career...

--- CS Career ---
Data: {
  "csstats": {
    "accountid": "16207002",
    "gamesplayed": 3102,
    "wins": 1788,
    "kills": 12555
  }
}
Fetching CS Ranked...

--- CS Ranked ---
Data: {
  "csstats": {
    "accountid": "16207002",
    "gamesplayed": 56,
    "wins": 30,
    "kills": 196
  }
}

-------------- items.js:
Loaded 27989 items into database.
Starting Items Test for UID: 12345678...
Getting Player Items...
[i] No credentials provided, loading from config/credentials.yaml.

--- Summary ---
Nickname: FB:ㅤ@GMRemyX
UID: 12345678
Outfit Items: 1
Weapon Items: 0
Skills Equipped: 6
Skills: 211000028, 214049006, 205000805, 211043045, 203038045, 204041011
Pet Name: SiNo
Pet ID: Poring

--- First 5 Outfits ---
- Unknown Item (ID: 50)

All tests passed successfully!
```

## Project Structure
- `lib/api.js`: core API client
- `lib/protobuf.js`: protobuf encode/decode
- `lib/crypto.js`: AES encryption
- `lib/utils.js`: item processing utilities
- `config/settings.yaml`: core settings
- `config/credentials.yaml`: default login credentials
- `proto/`: protobuf schema files
- `data/items.json`: item data source

## Metadata
- npm: `@spinzaf/freefire-api`
- repository: `https://github.com/spinzaf/freefire-api`
- license: GPL-3.0

## Acknowledgements
We perform this work standing on the shoulders of giants. Special thanks to the open-source community for their Reverse Engineering efforts.

- `0xMe/FreeFire-Api`: Prior research established a Python-based workflow. This project converts that logic into an easy-to-use JavaScript implementation, with equivalent functionality.

## Support
If you find this project helpful and would like to support the development, you can treat me to a coffee! ☕

- Donate via Saweria: https://saweria.co/spinzaf

A huge thank you to everyone who has supported! Your support keeps this project alive. ❤️

## License
GNU General Public License v3.0
