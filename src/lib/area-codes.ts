/**
 * US/Canada area code → "City, ST" lookup.
 * Covers ~400 active NANP area codes.
 * Returns null for unrecognized or non-US/CA numbers.
 */
const AREA_CODE_MAP: Record<string, string> = {
  // Alabama
  "205": "Birmingham, AL", "251": "Mobile, AL", "256": "Huntsville, AL", "334": "Montgomery, AL", "938": "Huntsville, AL",
  // Alaska
  "907": "Alaska",
  // Arizona
  "480": "Scottsdale, AZ", "520": "Tucson, AZ", "602": "Phoenix, AZ", "623": "Glendale, AZ", "928": "Flagstaff, AZ",
  // Arkansas
  "479": "Fort Smith, AR", "501": "Little Rock, AR", "870": "Jonesboro, AR",
  // California
  "209": "Stockton, CA", "213": "Los Angeles, CA", "310": "Los Angeles, CA", "323": "Los Angeles, CA",
  "408": "San Jose, CA", "415": "San Francisco, CA", "424": "Los Angeles, CA", "442": "Oceanside, CA",
  "510": "Oakland, CA", "530": "Redding, CA", "559": "Fresno, CA", "562": "Long Beach, CA",
  "619": "San Diego, CA", "626": "Pasadena, CA", "628": "San Francisco, CA", "650": "Palo Alto, CA",
  "657": "Anaheim, CA", "661": "Bakersfield, CA", "669": "San Jose, CA", "707": "Santa Rosa, CA",
  "714": "Anaheim, CA", "747": "Los Angeles, CA", "760": "Palm Springs, CA", "805": "Ventura, CA",
  "818": "Burbank, CA", "831": "Monterey, CA", "858": "San Diego, CA", "909": "San Bernardino, CA",
  "916": "Sacramento, CA", "925": "Walnut Creek, CA", "949": "Irvine, CA", "951": "Riverside, CA",
  // Colorado
  "303": "Denver, CO", "719": "Colorado Springs, CO", "720": "Denver, CO", "970": "Fort Collins, CO",
  // Connecticut
  "203": "Bridgeport, CT", "475": "Bridgeport, CT", "860": "Hartford, CT", "959": "Hartford, CT",
  // Delaware
  "302": "Wilmington, DE",
  // Florida
  "239": "Naples, FL", "305": "Miami, FL", "321": "Orlando, FL", "352": "Gainesville, FL",
  "386": "Daytona Beach, FL", "407": "Orlando, FL", "561": "West Palm Beach, FL", "689": "Orlando, FL",
  "727": "St. Petersburg, FL", "754": "Fort Lauderdale, FL", "772": "Port St. Lucie, FL",
  "786": "Miami, FL", "813": "Tampa, FL", "850": "Tallahassee, FL", "863": "Lakeland, FL",
  "904": "Jacksonville, FL", "941": "Sarasota, FL", "954": "Fort Lauderdale, FL",
  // Georgia
  "229": "Albany, GA", "404": "Atlanta, GA", "470": "Atlanta, GA", "478": "Macon, GA",
  "678": "Atlanta, GA", "706": "Augusta, GA", "762": "Augusta, GA", "770": "Atlanta suburbs, GA",
  "912": "Savannah, GA",
  // Hawaii
  "808": "Hawaii",
  // Idaho
  "208": "Boise, ID", "986": "Boise, ID",
  // Illinois
  "217": "Springfield, IL", "224": "Chicago suburbs, IL", "309": "Peoria, IL", "312": "Chicago, IL",
  "331": "Aurora, IL", "447": "Champaign, IL", "464": "Chicago, IL", "618": "East St. Louis, IL",
  "630": "Naperville, IL", "708": "Chicago suburbs, IL", "773": "Chicago, IL", "779": "Rockford, IL",
  "815": "Rockford, IL", "847": "Chicago suburbs, IL", "872": "Chicago, IL",
  // Indiana
  "219": "Gary, IN", "260": "Fort Wayne, IN", "317": "Indianapolis, IN", "463": "Indianapolis, IN",
  "574": "South Bend, IN", "765": "Lafayette, IN", "812": "Evansville, IN", "930": "Evansville, IN",
  // Iowa
  "319": "Cedar Rapids, IA", "515": "Des Moines, IA", "563": "Davenport, IA", "641": "Mason City, IA", "712": "Sioux City, IA",
  // Kansas
  "316": "Wichita, KS", "620": "Dodge City, KS", "785": "Topeka, KS", "913": "Kansas City, KS",
  // Kentucky
  "270": "Bowling Green, KY", "364": "Bowling Green, KY", "502": "Louisville, KY", "606": "Ashland, KY", "859": "Lexington, KY",
  // Louisiana
  "225": "Baton Rouge, LA", "318": "Shreveport, LA", "337": "Lafayette, LA", "504": "New Orleans, LA", "985": "Houma, LA",
  // Maine
  "207": "Portland, ME",
  // Maryland
  "240": "Rockville, MD", "301": "Rockville, MD", "410": "Baltimore, MD", "443": "Baltimore, MD", "667": "Baltimore, MD",
  // Massachusetts
  "339": "Boston suburbs, MA", "351": "Lowell, MA", "413": "Springfield, MA", "508": "Worcester, MA",
  "617": "Boston, MA", "774": "Worcester, MA", "781": "Boston suburbs, MA", "857": "Boston, MA", "978": "Lowell, MA",
  // Michigan
  "231": "Grand Rapids, MI", "248": "Detroit suburbs, MI", "269": "Kalamazoo, MI", "313": "Detroit, MI",
  "517": "Lansing, MI", "586": "Detroit suburbs, MI", "616": "Grand Rapids, MI", "679": "Detroit, MI",
  "734": "Ann Arbor, MI", "810": "Flint, MI", "906": "Upper Peninsula, MI", "947": "Detroit suburbs, MI", "989": "Saginaw, MI",
  // Minnesota
  "218": "Duluth, MN", "320": "St. Cloud, MN", "507": "Rochester, MN", "612": "Minneapolis, MN",
  "651": "St. Paul, MN", "763": "Minneapolis suburbs, MN", "952": "Minneapolis suburbs, MN",
  // Mississippi
  "228": "Biloxi, MS", "601": "Jackson, MS", "662": "Tupelo, MS", "769": "Jackson, MS",
  // Missouri
  "314": "St. Louis, MO", "417": "Springfield, MO", "557": "St. Louis, MO", "573": "Columbia, MO",
  "636": "St. Louis suburbs, MO", "660": "Sedalia, MO", "816": "Kansas City, MO",
  // Montana
  "406": "Montana",
  // Nebraska
  "308": "Grand Island, NE", "402": "Omaha, NE", "531": "Omaha, NE",
  // Nevada
  "702": "Las Vegas, NV", "725": "Las Vegas, NV", "775": "Reno, NV",
  // New Hampshire
  "603": "New Hampshire",
  // New Jersey
  "201": "Jersey City, NJ", "551": "Jersey City, NJ", "609": "Trenton, NJ", "640": "Trenton, NJ",
  "732": "New Brunswick, NJ", "848": "New Brunswick, NJ", "856": "Camden, NJ", "862": "Newark, NJ",
  "908": "Elizabeth, NJ", "973": "Newark, NJ",
  // New Mexico
  "505": "Albuquerque, NM", "575": "Las Cruces, NM",
  // New York
  "212": "New York City, NY", "315": "Syracuse, NY", "332": "New York City, NY", "347": "New York City, NY",
  "516": "Long Island, NY", "518": "Albany, NY", "585": "Rochester, NY", "607": "Binghamton, NY",
  "631": "Long Island, NY", "646": "New York City, NY", "680": "Syracuse, NY", "716": "Buffalo, NY",
  "718": "New York City, NY", "845": "Poughkeepsie, NY", "914": "White Plains, NY", "917": "New York City, NY",
  "929": "New York City, NY", "934": "Long Island, NY",
  // North Carolina
  "252": "Greenville, NC", "336": "Greensboro, NC", "704": "Charlotte, NC", "743": "Greensboro, NC",
  "828": "Asheville, NC", "910": "Fayetteville, NC", "919": "Raleigh, NC", "980": "Charlotte, NC", "984": "Raleigh, NC",
  // North Dakota
  "701": "North Dakota",
  // Ohio
  "216": "Cleveland, OH", "220": "Columbus, OH", "234": "Akron, OH", "283": "Cincinnati, OH",
  "330": "Akron, OH", "380": "Columbus, OH", "419": "Toledo, OH", "440": "Cleveland suburbs, OH",
  "513": "Cincinnati, OH", "567": "Toledo, OH", "614": "Columbus, OH", "740": "Lancaster, OH", "937": "Dayton, OH",
  // Oklahoma
  "405": "Oklahoma City, OK", "539": "Tulsa, OK", "580": "Lawton, OK", "918": "Tulsa, OK",
  // Oregon
  "458": "Eugene, OR", "503": "Portland, OR", "541": "Eugene, OR", "971": "Portland, OR",
  // Pennsylvania
  "215": "Philadelphia, PA", "223": "Lancaster, PA", "267": "Philadelphia, PA", "272": "Scranton, PA",
  "412": "Pittsburgh, PA", "445": "Philadelphia, PA", "484": "Allentown, PA", "570": "Scranton, PA",
  "610": "Allentown, PA", "717": "Harrisburg, PA", "724": "Pittsburgh suburbs, PA", "814": "Erie, PA",
  "878": "Pittsburgh, PA",
  // Rhode Island
  "401": "Rhode Island",
  // South Carolina
  "803": "Columbia, SC", "839": "Columbia, SC", "843": "Charleston, SC", "854": "Charleston, SC", "864": "Greenville, SC",
  // South Dakota
  "605": "South Dakota",
  // Tennessee
  "423": "Chattanooga, TN", "615": "Nashville, TN", "629": "Nashville, TN", "731": "Jackson, TN",
  "865": "Knoxville, TN", "901": "Memphis, TN", "931": "Clarksville, TN",
  // Texas
  "210": "San Antonio, TX", "214": "Dallas, TX", "254": "Waco, TX", "281": "Houston, TX",
  "325": "Abilene, TX", "346": "Houston, TX", "361": "Corpus Christi, TX", "409": "Beaumont, TX",
  "430": "Tyler, TX", "432": "Midland, TX", "469": "Dallas, TX", "512": "Austin, TX",
  "682": "Fort Worth, TX", "713": "Houston, TX", "726": "San Antonio, TX", "737": "Austin, TX",
  "806": "Lubbock, TX", "817": "Fort Worth, TX", "830": "New Braunfels, TX", "832": "Houston, TX",
  "903": "Tyler, TX", "915": "El Paso, TX", "936": "Huntsville, TX", "940": "Wichita Falls, TX",
  "956": "Laredo, TX", "972": "Dallas, TX", "979": "College Station, TX",
  // Utah
  "385": "Salt Lake City, UT", "435": "St. George, UT", "801": "Salt Lake City, UT",
  // Vermont
  "802": "Vermont",
  // Virginia
  "276": "Bristol, VA", "434": "Charlottesville, VA", "540": "Roanoke, VA", "571": "Northern Virginia, VA",
  "703": "Northern Virginia, VA", "757": "Virginia Beach, VA", "804": "Richmond, VA", "826": "Virginia, VA",
  // Washington
  "206": "Seattle, WA", "253": "Tacoma, WA", "360": "Olympia, WA", "425": "Bellevue, WA",
  "509": "Spokane, WA", "564": "Vancouver, WA",
  // Washington DC
  "202": "Washington, DC",
  // West Virginia
  "304": "Charleston, WV", "681": "Charleston, WV",
  // Wisconsin
  "262": "Milwaukee suburbs, WI", "414": "Milwaukee, WI", "534": "Eau Claire, WI",
  "608": "Madison, WI", "715": "Wausau, WI", "920": "Green Bay, WI",
  // Wyoming
  "307": "Wyoming",
  // Canada — major
  "204": "Winnipeg, MB", "226": "Windsor, ON", "236": "Vancouver, BC", "249": "Sudbury, ON",
  "250": "Victoria, BC", "289": "Hamilton, ON", "306": "Saskatchewan", "343": "Ottawa, ON",
  "365": "Hamilton, ON", "367": "Quebec City, QC", "368": "Calgary, AB", "382": "London, ON",
  "403": "Calgary, AB", "416": "Toronto, ON", "418": "Quebec City, QC", "431": "Winnipeg, MB",
  "437": "Toronto, ON", "438": "Montreal, QC", "450": "Montreal suburbs, QC", "506": "New Brunswick",
  "514": "Montreal, QC", "519": "London, ON", "548": "London, ON", "579": "Montreal suburbs, QC",
  "581": "Quebec City, QC", "587": "Calgary, AB", "604": "Vancouver, BC", "613": "Ottawa, ON",
  "639": "Saskatchewan", "647": "Toronto, ON", "672": "Vancouver, BC", "705": "Sudbury, ON",
  "709": "Newfoundland", "742": "Toronto, ON", "778": "Vancouver, BC", "780": "Edmonton, AB",
  "782": "Nova Scotia", "807": "Thunder Bay, ON", "819": "Sherbrooke, QC", "825": "Alberta",
  "867": "Yukon/NWT", "873": "Quebec City, QC", "902": "Nova Scotia", "905": "Hamilton, ON",
};

/**
 * Extracts the 3-digit area code from a phone number string,
 * handling +1, spaces, dashes, parens, dots.
 */
function extractAreaCode(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits[0] === "1") return digits.slice(1, 4);
  if (digits.length === 10) return digits.slice(0, 3);
  return null;
}

/** Returns a short location string like "Miami, FL" or null if unknown. */
export function locationFromPhone(phone: string | null | undefined): string | null {
  const ac = extractAreaCode(phone);
  if (!ac) return null;
  return AREA_CODE_MAP[ac] ?? null;
}
