function decodeQueryParamPart(part) {
  return decodeURIComponent(part.replace(/\+/gm, '%20'));
}

export default function parseQueryString(queryString) {
  const pairs = queryString.split('&'),
    queryParams = {};
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    let key = decodeQueryParamPart(pair[0]);
    const keyLength = key.length;
    let isArray = false;
    let value;

    if (pair.length === 1) {
      value = 'true';
    } else {
      if (keyLength > 2 && key.slice(keyLength - 2) === '[]') {
        isArray = true;
        key = key.slice(0, keyLength - 2);
        if (!queryParams[key]) {
          queryParams[key] = [];
        }
      }
      value = pair[1] ? decodeQueryParamPart(pair[1]) : '';
    }

    if (isArray) {
      queryParams[key].push(value);
    } else if (queryParams[key]) {
      if (typeof queryParams[key] !== 'object') {
        queryParams[key] = [queryParams[key]];
      }
      queryParams[key].push(value);
    } else {
      queryParams[key] = value;
    }
  }
  return queryParams;
}
