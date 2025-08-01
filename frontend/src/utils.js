function createIcon(url) {
    var myIcon = L.icon({
        iconUrl: url,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [-3, -76],
    });
    return myIcon;
}

function locationToArray(loc) {
    return [loc.y, loc.x];
}

function getIcon(icon) {
  return '/icons/' + icon;
}

export {
    createIcon,
    locationToArray,
    getIcon,
};
