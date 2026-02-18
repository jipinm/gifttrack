/**
 * Alert Sound Utility
 * Plays a notification/alert sound using expo-av
 * Used for event reminders and important notifications
 */
import { Audio } from 'expo-av';

let soundObject: Audio.Sound | null = null;

/**
 * Play an alert/notification sound
 * Uses system-compatible approach with expo-av
 */
export async function playAlertSound(): Promise<void> {
  try {
    // Configure audio mode for notification-style playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Unload previous sound if exists
    if (soundObject) {
      try {
        await soundObject.unloadAsync();
      } catch {
        // ignore
      }
      soundObject = null;
    }

    // Create and play a short notification tone
    // Using a programmatic approach with a short audio beep
    const { sound } = await Audio.Sound.createAsync(
      // Short notification sound - a standard alert tone
      // We use require() for a bundled asset
      require('../../assets/sounds/notification.wav'),
      {
        shouldPlay: true,
        volume: 0.8,
      }
    );

    soundObject = sound;

    // Auto-cleanup after playback finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        soundObject = null;
      }
    });
  } catch (error) {
    console.warn('Could not play alert sound:', error);
    // Fail silently — vibration is the fallback
  }
}

/**
 * Cleanup: unload any loaded sound
 */
export async function unloadAlertSound(): Promise<void> {
  if (soundObject) {
    try {
      await soundObject.unloadAsync();
    } catch {
      // ignore
    }
    soundObject = null;
  }
}
