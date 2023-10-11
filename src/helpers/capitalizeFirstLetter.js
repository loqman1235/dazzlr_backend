const capitalizeFirstLetter = (str) => {
  if (str[0] !== str[0].toUpperCase()) {
    return str[0].toUpperCase() + str.slice(1);
  }
  return str;
};

export default capitalizeFirstLetter;
