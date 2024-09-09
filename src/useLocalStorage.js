const useLocalStorage = (key,value) => {
  if (value) {
    value = JSON.stringify(value)
    localStorage.setItem(key, value)
    return;
  } 
  else {
    const value =  JSON.parse(localStorage.getItem(key))
    return value ? value : null
  }

}

export default useLocalStorage