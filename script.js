let deliveryDaysData = {};

fetch('Suburb.json')
    .then(response => response.json())
    .then(data => deliveryDaysData = data)
    .catch(error => console.error('Error loading delivery days data:', error));


// Fixed Price Suburbs List
const fixedPriceSuburbs = {
    
};

// Rest of your existing script.js code...


let map;
let directionsService;
let directionsRenderer;

// Function to initialize the map and the Autocomplete
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: { lat: -37.8136, lng: 144.9631 } // Centered at Melbourne
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Initialize the Autocomplete
    initAutocomplete();
}

// Initialize the Google Places Autocomplete
function initAutocomplete() {
    var victoriaBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-39.224089, 140.961681), // Southwest coordinates of Victoria
        new google.maps.LatLng(-33.981281, 150.014707)  // Northeast coordinates of Victoria
    );

    new google.maps.places.Autocomplete(
        document.getElementById('location'), 
        {
            types: ['geocode'],
            componentRestrictions: {'country': 'AU'},
            bounds: victoriaBounds
        }
    );
}


// Event listener for the form submission
document.getElementById('deliveryForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the form from submitting the traditional way
    let customerLocation = document.getElementById('location').value;

    // Always calculate and display the route
    calculateAndDisplayRoute('396-408 Whitehorse Rd, Nunawading VIC 3131', customerLocation);

    let fixedPriceSuburb = Object.keys(fixedPriceSuburbs).find(suburb => customerLocation.includes(suburb));
    if (fixedPriceSuburb) {
        // Display the fixed price in a uniform format
        document.getElementById('result').innerText = 'Calculated Delivery Price: $' + fixedPriceSuburbs[fixedPriceSuburb] + ' plus GST';
    } else {
        // Perform regular distance calculation if not a fixed price suburb
        calculateDistance(customerLocation);
    }
});



// Function to calculate the distance using the Google Maps Distance Matrix Service
function calculateDistance(customerLocation) {
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: ['396-408 Whitehorse Rd, Nunawading VIC 3131'],
            destinations: [customerLocation],
            travelMode: 'DRIVING',
            unitSystem: google.maps.UnitSystem.METRIC,
        }, callback);
}

// Callback function for the Distance Matrix Service
function callback(response, status) {
    if (status == 'OK') {
        var origins = response.originAddresses;
        var destinations = response.destinationAddresses;
        for (var i = 0; i < origins.length; i++) {
            var results = response.rows[i].elements;
            for (var j = 0; j < results.length; j++) {
                var element = results[j];
                var distance = element.distance.text;
                var duration = element.duration.text;
                var from = origins[i];
                var to = destinations[j];
                console.log('Distance from ' + from + ' to ' + to + ' is ' + distance + ' and will take approximately ' + duration);
                calculateDeliveryPrice(element.distance.value); // Pass the distance in meters
            }
        }
    } else {
        console.log('Error with distance matrix request:', status);
    }
}

// Function to calculate and display the route on the map
function calculateAndDisplayRoute(origin, destination) {
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: 'DRIVING',
        provideRouteAlternatives: false // Change this to false if you're not interested in alternatives
    }, function(response, status) {
        if (status === 'OK') {
            // Directly set the directions on the map without searching for the shortest route
            directionsRenderer.setDirections(response);

            // Assuming the first route is the standard route
            let standardRouteDistance = response.routes[0].legs[0].distance.value;

            // Check if destination is a fixed price suburb
            let destinationSuburb = Object.keys(fixedPriceSuburbs).find(suburb => destination.includes(suburb));
            
            if (destinationSuburb) {
                // Set the fixed price for the suburb
                document.getElementById('result').innerText = 'Calculated Delivery Price: $' + fixedPriceSuburbs[destinationSuburb] + ' plus GST';
            } else {
                // Use the distance of the standard route for calculating the delivery price for non-fixed price suburbs
                calculateDeliveryPrice(standardRouteDistance);
            }

            // New code to extract and display suburb name
            extractAndDisplaySuburb(destination);

        } else {
            console.error('Directions request failed due to ' + status);
        }
    });
}

// New function to extract and display the suburb name
function extractAndDisplaySuburb(destinationAddress) {
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': destinationAddress }, function(results, status) {
        if (status === 'OK') {
            let suburb = '';
            for (let component of results[0].address_components) {
                if (component.types.includes('locality')) {
                    suburb = component.long_name.toUpperCase();
                    break;
                }
            }
            if (suburb && deliveryDaysData[suburb]) {
                let availableDays = Object.entries(deliveryDaysData[suburb])
                    .filter(([day, available]) => available)
                    .map(([day, _]) => day)
                    .join(", ");

                let resultTextElement = document.getElementById('result');
                resultTextElement.innerHTML += `<br><br> ${suburb}<br> Delivery Days: ${availableDays}`;
            } else {
                let resultTextElement = document.getElementById('result');
                resultTextElement.innerHTML += `<br><br> ${suburb}<br> Delivery information not available`;
            }
        } else {
            console.error('Geocode was not successful for the following reason: ' + status);
        }
    });
}




function calculateDeliveryPrice(distanceInMeters) {
    var distanceInKm = distanceInMeters / 1000;
    var originalPrice;
    var calculatedPrice;
    var extraMessage = "";

    if (distanceInKm > 105) {
        var additionalDistance = distanceInKm - 105;
        var additionalCharge = additionalDistance * 2.50;
        originalPrice = 310 + additionalCharge;
        calculatedPrice = Math.ceil(originalPrice * 1.1 + 10); // Apply 10% increase and add $10
        extraMessage = "<br><br><strong>Please give us a call to confirm a specific day for delivery.<br><br>The below day is just an estimate.";
    } else {
        if (distanceInKm <= 5) {
            originalPrice = 70;
        } else if (distanceInKm <= 10) {
            originalPrice = 80;
        } else if (distanceInKm <= 15) {
            originalPrice = 90;
        } else if (distanceInKm <= 20) {
            originalPrice = 110;
        } else if (distanceInKm <= 25) {
            originalPrice = 120;
        } else if (distanceInKm <= 35) {
            originalPrice = 130;
        } else if (distanceInKm <= 45) {
            originalPrice = 140;
        } else if (distanceInKm <= 55) {
            originalPrice = 150;
        } else if (distanceInKm <= 65) {
            originalPrice = 170;
        } else if (distanceInKm <= 75) {
            originalPrice = 190;
        } else if (distanceInKm <= 85) {
            originalPrice = 230;
        } else if (distanceInKm <= 95) {
            originalPrice = 270;
        } else if (distanceInKm <= 105) {
            originalPrice = 310;
        }

        // Apply 10% increase and add $10 to the original price
        calculatedPrice = Math.round(originalPrice * 1.1 + 5); 
    }

    // Add the permanent message in red
    // var permanentMessage = '<br><br><span style="color: red;">Delivery Days below are not yet accurate. <br>Please ignore. </span>';
    var resultText = 'Calculated Delivery Price: $' + calculatedPrice + ' inclusive of GST' + extraMessage;

    // Display the result on the page
    document.getElementById('result').innerHTML = resultText;
}