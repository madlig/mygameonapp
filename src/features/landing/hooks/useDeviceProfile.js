// src/features/landing/hooks/useDeviceProfile.js
import { useState, useEffect, useCallback } from 'react';
import { 
  STORAGE_PROFILE_KEY, 
  classifyUserHardware, 
  runCanIRunIt 
} from '../utils/hardwareEngine';

const EVENT_NAME = 'mygameon_device_profile_updated';

export const useDeviceProfile = () => {
  const [profile, setProfileState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [filterRecommendedOnly, setFilterRecommendedOnlyState] = useState(() => {
    try {
      return localStorage.getItem('mygameon_filter_my_device_only') === 'true';
    } catch {
      return false;
    }
  });

  // Sync multi-component / cross-tab updates
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
        setProfileState(raw ? JSON.parse(raw) : null);
      } catch {
        setProfileState(null);
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const saveProfile = useCallback((input) => {
    let classified;
    if (input && input.tier && input.cpuShort) {
      classified = {
        ...input,
        timestamp: new Date().toISOString(),
      };
    } else {
      const { cpuId, ramGB, gpuId, deviceType } = input || {};
      classified = classifyUserHardware({ cpuId, ramGB, gpuId, deviceType });
    }
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(classified));
      setProfileState(classified);
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch (e) {
      console.error('Failed to save device profile:', e);
    }
    return classified;
  }, []);

  const resetProfile = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
      localStorage.removeItem('mygameon_filter_my_device_only');
      setProfileState(null);
      setFilterRecommendedOnlyState(false);
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch {
      // ignore
    }
  }, []);

  const toggleFilterRecommended = useCallback((val) => {
    setFilterRecommendedOnlyState(val);
    try {
      localStorage.setItem('mygameon_filter_my_device_only', String(val));
    } catch {
      // ignore
    }
  }, []);

  const checkGame = useCallback((game) => {
    if (!profile) return null;
    return runCanIRunIt(game, profile);
  }, [profile]);

  return {
    profile,
    isConfigured: Boolean(profile && profile.tier),
    saveProfile,
    resetProfile,
    filterRecommendedOnly,
    toggleFilterRecommended,
    checkGame,
  };
};
