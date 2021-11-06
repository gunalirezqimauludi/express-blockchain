function hasAllProperties(obj, props) {
    for (var i = 0; i < props.length; i++) {
        if (!obj.hasOwnProperty(props[i]))
            return false;
    }
    return true;
}

module.exports = {
    hasAllProperties
}