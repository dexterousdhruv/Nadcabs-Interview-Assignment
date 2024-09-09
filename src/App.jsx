import { useEffect, useRef, useState } from 'react'
import useLocalStorage from './useLocalStorage'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import axios from 'axios'


function App() {
  const timeInSeconds = (dateObj) => {
    return (dateObj.getHours() * 60 * 60 + dateObj.getMinutes() * 60 + dateObj.getSeconds())
  }

  const [displayTime, setDisplayTime] = useState(new Date())
  const [ipInfo, setIpInfo] = useState('')
  const [browserInfo, setBrowserInfo] = useState({})
  const [deviceId, setDeviceId] = useState('')

  const [idleTime, setIdleTime] = useState(0);
  const [terminationTime, setTerminationTime] = useState(null);
  const idleStart = useRef(null);
  const isIdle = useRef(false);

  const formatTime = (displayT) => {
    const hours = Math.floor(displayT / 3600)
    const mins = Math.floor((displayT % 3600) / 60)
    const secs = Math.floor((displayT % 3600) % 60) 
    return ((hours < 10 ? "0"+ hours : hours) + ":" + (mins < 10 ? "0"+ mins : mins) + ":" + (secs < 10 ? "0"+ secs : secs))
  }

  

  useEffect(() => {
    const getBrowserInfo = () => {
      const { navigator }  = window
      setBrowserInfo({
        appName: navigator.appName,
        appVersion: navigator.appVersion,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
      });
    };

    const getIpInfo = async () => {
      try {
        const response = await axios.get('https://api.ipify.org?format=json');
        setIpInfo(response.data.ip);
      } catch (error) {
        console.error("Error fetching IP info:", error);
      }
    };

    const getDeviceId = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceId(result.visitorId);
    };

    getBrowserInfo();
    getIpInfo();
    getDeviceId();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      useLocalStorage('lastCloseTime', displayTime.toISOString());
      useLocalStorage('lastTerminateTime', new Date().toISOString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [displayTime]);

  useEffect(() => {
    const lastCloseTime = useLocalStorage('lastCloseTime');
    const lastTerminateTime = useLocalStorage('lastTerminateTime');

    if (lastCloseTime) {
      setDisplayTime(new Date(lastCloseTime));
    } else {
      setDisplayTime(new Date());
    }

    if (lastTerminateTime) {
      setTerminationTime(new Date(lastTerminateTime));
    }

    const timeout = setInterval(() => {
      setDisplayTime((prevTime) => new Date(prevTime.getTime() + 1000));
    }, 1000);

    return () => clearInterval(timeout);
  }, [])

  useEffect(() => {
    const handleActivity = () => {
      if (isIdle.current) {
        isIdle.current = false;
      }
      idleStart.current = Date.now();
      setIdleTime(0);
    };

    const updateIdleTime = () => {
      if (idleStart.current) {
        const currentIdleTime = Math.floor((Date.now() - idleStart.current) / 1000);
        setIdleTime(currentIdleTime);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const idleInterval = setInterval(updateIdleTime, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(idleInterval);
    };
  }, []);

  
 

  return (
    <div className='flex flex-col h-screen w-full justify-center items-center gap-8 bg-gray-300'>
    
      <h1 className='text-5xl'>Digital Timer</h1>
      <h1 className='text-4xl'>{formatTime(timeInSeconds(new Date(displayTime)))}</h1>

      <div className='text-center'>
        <h3 className='text-2xl'>Device Id:</h3>
        <p className='text-lg'>{deviceId}</p>
      </div>
      <div className='text-center'>
        <h3 className='text-2xl'>Browser Info :</h3>
        <ul className='text-lg '>
          {Object.entries(browserInfo).map((el, i) => {
            return <li key={i} >{el[0].toUpperCase()} :  {el[1]}</li>
          })}
        </ul>
      </div>
 
      <h3 className='text-2xl text-center'>IP Address: {ipInfo}</h3>
      <h3 className='text-2xl text-center'>Idle Time: {formatTime(idleTime)}</h3>
      <h3 className='text-2xl text-center'>Last Terminated: {formatTime(timeInSeconds(new Date(terminationTime)))}</h3>
    </div>
  )
}

export default App
