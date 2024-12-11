import React, { useState, useRef, useEffect, useCallback } from 'react';
import {View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, ScrollView, Switch, PanResponder, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
// Import Firebase 
import { auth, db } from './firebase'; 
import { ref, get, onValue, set  } from 'firebase/database';

const { width, height } = Dimensions.get('window');

const TabButton = ({ icon, label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={isActive ? '#FFFFFF' : '#A0A0A0'} />
      <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

const sendDoorbellNotification = () => {
  // Assuming you've already set up Firebase and PushNotification
  PushNotification.localNotification({
    title: 'Doorbell Alert',
    message: 'Someone is at the door!',
  });

  // Update the doorbell state in Firebase
  set(ref(db, 'doorbell'), true); // Update the doorbell status to true when pressed
};

const WeatherSection = () => {
  const [weatherData, setWeatherData] = useState({
    temperature: 0,
    humidity: '0%',
    icon: 'cloud-outline', // default icon
    location: 'Temperature Detector',
  });

  useEffect(() => {
  const weatherRef = ref(db, 'sensor'); // path to your sensor data in Firebase
  // Listen to the real-time updates in Firebase
  const unsubscribe = onValue(weatherRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Update the weather data with the values from Firebase
      setWeatherData({
        temperature: data.temperature,
        humidity: data.humidity,
        icon: 'partly-sunny-outline', // Use an appropriate icon based on data, you can expand this later
        name: 'Temperature', // Static location or dynamic if needed
      });
    }
  });

    return () => unsubscribe(); // Cleanup listener when component is unmounted
  }, []); // Empty dependency array ensures this runs only once when component mounts

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.weatherHeader}>
        <Text style={styles.weatherName}>{weatherData.name}</Text>
      </View>
      <View style={styles.weatherContent}>
        <Ionicons name={weatherData.icon} size={80} color="#4a90e2" />
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherTemp}>{weatherData.temperature}°F</Text>
          <Text style={styles.weatherCondition}>Condition</Text> {/* You can add dynamic condition later */}
          <Text style={styles.weatherDetails}>Humidity: {weatherData.humidity}</Text>
        </View>
      </View>
    </View>
  );
};

const SmartHomeLightingSection = () => {
  const [roomLights, setRoomLights] = useState({
    bedroom1: false,
    bedroom2: false,
    dining: false,
    garage: false,
    living_room: false,
  });

  const [allLightsOn, setAllLightsOn] = useState(false);

  // Update light states in Firebase
  const updateLightState = (room, state) => {
    set(ref(db, `lights/${room}`), state ? 1 : 0); // Update individual room light state in Firebase
  };

  // Toggle a specific room's light
  const toggleRoomLight = (room) => {
    const newState = !roomLights[room];

    // Update local state and Firebase
    setRoomLights((prevLights) => {
      const updatedLights = { ...prevLights, [room]: newState };
      const allOn = Object.values(updatedLights).every((value) => value); // Check if all lights are on
      setAllLightsOn(allOn); // Update "Open all lights" state
      return updatedLights;
    });

    updateLightState(room, newState);
  };

  // Toggle all lights
  const toggleAllLights = () => {
    const newState = !allLightsOn;

    // Update local state and Firebase
    setRoomLights((prevLights) => {
      const updatedLights = Object.keys(prevLights).reduce((acc, room) => {
        acc[room] = newState;
        updateLightState(room, newState); // Update each light in Firebase
        return acc;
      }, {});
      return updatedLights;
    });

    setAllLightsOn(newState);
  };

  // LightItem for individual lights
  const LightItem = ({ room, label, isOn }) => (
    <TouchableOpacity
      style={styles.lightingItem}
      onPress={() => toggleRoomLight(room)}
      activeOpacity={0.7}
    >
      <View style={[styles.lightBulbContainer, isOn && styles.lightBulbContainerOn]}>
        <Ionicons
          name={isOn ? "bulb" : "bulb-outline"}
          size={40}
          color={isOn ? "#FFFFFF" : "#A0A0A0"}
        />
      </View>
      <Text style={styles.lightingText}>{label}</Text>
      <Text style={[styles.lightingStatus, { color: isOn ? "#4a90e2" : "#A0A0A0" }]}>
        {isOn ? "On" : "Off"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Smart Home Lighting</Text>
      <View style={styles.lightingContent}>
        {/* Control for "Open all lights" */}
        <TouchableOpacity
          style={styles.lightingItem}
          onPress={toggleAllLights}
          activeOpacity={0.7}
        >
          <View style={[styles.lightBulbContainer, allLightsOn && styles.lightBulbContainerOn]}>
            <Ionicons
              name={allLightsOn ? "bulb" : "bulb-outline"}
              size={40}
              color={allLightsOn ? "#FFFFFF" : "#A0A0A0"}
            />
          </View>
          <Text style={styles.lightingText}>Open all lights</Text>
          <Text
            style={[styles.lightingStatus, { color: allLightsOn ? "#4a90e2" : "#A0A0A0" }]}
          >
            {allLightsOn ? "On" : "Off"}
          </Text>
        </TouchableOpacity>
       
      </View>
    </View>
  );
};


const RoomControlsSection = () => {
  const [roomLights, setRoomLights] = useState({
    bedroom1: false,
    bedroom2: false,
    dining: false,
    garage: false,
    living_room: false,
  });

  // Fetch light states from Firebase
  useEffect(() => {
    const lightsRef = ref(db, 'lights');
    const unsubscribe = onValue(lightsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomLights({
          bedroom1: data.bedroom1 === 1,
          bedroom2: data.bedroom2 === 1,
          dining: data.dining === 1,
          garage: data.garage === 1,
          living_room: data.living_room === 1,
        });
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

   // Update light state in Firebase
   const toggleLight = (room) => {
    const newValue = !roomLights[room] ? 1 : 0;
    set(ref(db, `lights/${room}`), newValue); // Update light state in Firebase
  };

  const RoomControl = ({ room, label, icon }) => (
    <View style={[styles.roomControlBox, roomLights[room] && styles.roomControlBoxOn]}>
      <Text style={styles.roomControlLabel}>{label}</Text>
      <View style={styles.roomControlIconContainer}>
        <Ionicons name={icon} size={24} color={roomLights[room] ? "#FFFFFF" : "#A0A0A0"} />
      </View>
      <Switch
        value={roomLights[room]}
        onValueChange={() => toggleLight(room)}
        trackColor={{ false: "#e0e0e0", true: "#4a90e2" }}
        thumbColor={roomLights[room] ? "#FFFFFF" : "#f4f3f4"}
        ios_backgroundColor="#e0e0e0"
      />
    </View>
  );

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.roomControlsGrid}>
      <Text style={styles.sectionTitle}>Room Controls</Text>
      <RoomControl room="bedroom1" label="Bedroom 1" />
      <RoomControl room="bedroom2" label="Bedroom 2" />
      <RoomControl room="dining" label="Dining Room" />
      <RoomControl room="garage" label="Garage" />
      <RoomControl room="living_room" label="Living Room" />
      </View>
    </View>
  );
};
const SecurityControlsSection = () => {
  const [securityStatus, setSecurityStatus] = useState({
    garage: false,
    frontDoor: false,
  });

  const swipeAnim = useRef({
    garage: new Animated.Value(0),
    frontDoor: new Animated.Value(0),
  }).current;

  // Fetch garage door state from Firebase
  useEffect(() => {
    const garageDoorRef = ref(db, 'garage_door');
    const unsubscribe = onValue(garageDoorRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setSecurityStatus(prevState => ({
          ...prevState,
          garage: data === 1,  // If the value is 1, the door is open
        }));
      }
    });
  
    return () => unsubscribe();
  }, []);

  const panResponders = {
    garage: useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          if (!securityStatus.garage) {
            const newValue = Math.max(0, Math.min(100, gestureState.dx));
            swipeAnim.garage.setValue(newValue);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 50 && !securityStatus.garage) {
            Animated.timing(swipeAnim.garage, {
              toValue: 100,
              duration: 200,
              useNativeDriver: false,
            }).start(() => toggleLock('garage'));
          } else {
            Animated.spring(swipeAnim.garage, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        },
      })
    ).current,
    frontDoor: useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          if (!securityStatus.frontDoor) {
            const newValue = Math.max(0, Math.min(100, gestureState.dx));
            swipeAnim.frontDoor.setValue(newValue);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 50 && !securityStatus.frontDoor) {
            Animated.timing(swipeAnim.frontDoor, {
              toValue: 100,
              duration: 200,
              useNativeDriver: false,
            }).start(() => toggleLock('frontDoor'));
          } else {
            Animated.spring(swipeAnim.frontDoor, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        },
      })
    ).current,
  };

    const toggleLock = (item) => {
    if (item === 'garage') {
      // Toggle the garage door state
      const newState = !securityStatus[item]; // True -> open, false -> close
      set(ref(db, 'garage_door'), newState ? 1 : 0);  // 1 for open, 0 for closed
    }
    setSecurityStatus(prevStatus => ({
      ...prevStatus,
      [item]: !prevStatus[item]
    }));
    // Haptic feedback for status change
    Haptics.notificationAsync(
      securityStatus[item] ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
    if (!securityStatus[item]) {
      Animated.spring(swipeAnim[item], {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  };


  const SecurityControl = ({ item, label, icon }) => {
    const swipeInterpolate = swipeAnim[item].interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.securityControlBox}>
        <View style={styles.securityControlContent}>
          <Ionicons name={icon} size={24} color={securityStatus[item] ? "#4a90e2" : "#A0A0A0"} />
          <Text style={styles.securityControlLabel}>{label}</Text>
          <View style={styles.securityControlSwipeContainer}>
            <Animated.View
              style={[
                styles.securityControlSwipeBg,
                {
                  width: swipeInterpolate,
                  backgroundColor: securityStatus[item] ? 'rgba(255, 255, 255, 0.2)' : '#4a90e2',
                },
              ]}
            />
            <View
              style={styles.securityControlSwipeButton}
              {...panResponders[item].panHandlers}
            >
              <Ionicons
                name={securityStatus[item] ? "lock-open" : "lock-closed"}
                size={24}
                color={securityStatus[item] ? "#A0A0A0" : "#4a90e2"}
              />
            </View>
          </View>
        </View>
        {!securityStatus[item] && (
          <Text style={styles.swipeInstructionText}>Swipe to Open</Text>
        )}
        {securityStatus[item] && (
          <TouchableOpacity style={styles.unlockButton} onPress={() => toggleLock(item)}
          >
            <Text style={styles.unlockButtonText}>Tap to unlock</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Security Controls</Text>
      <View style={styles.securityControlsContainer}>
        <SecurityControl item="garage" label="Garage" icon="car-outline" />
        <SecurityControl item="frontDoor" label="Front Door" icon="home-outline" />
      </View>
    </View>
  );
};

const AboutUsSection = () => {
  const teamMembers = [
    { name: 'John Mark Capones', title: 'Project Manager', image: 'https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/451995635_1848285492249670_1646044216773349979_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_ohc=ql-s-fVsXWQQ7kNvgFHwn-c&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=AzQyPIy-Lwccqrzek67RKqe&oh=00_AYBNBxwX66fMSVVcIo1pO9ZIHsm4oNUigCWdgQX9CS2rBg&oe=675FAC1F' },
    { name: 'Mark Rivinson Zafra', title: 'Back-end Administrator', image: '' },
    { name: 'Leigh Xienne Gegrimos', title: 'Assurance Specialist for Quality & Security', image: 'https://scontent.fmnl17-5.fna.fbcdn.net/v/t39.30808-6/447674332_122189216324010069_8274525488206710261_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=D9cyEVbbLaUQ7kNvgGj8-n9&_nc_zt=23&_nc_ht=scontent.fmnl17-5.fna&_nc_gid=A4kQ4hsnvOS0fTlLFuszBlt&oh=00_AYAUJMXR5VKXmnccYbLB_cMPi021m_253Pq9ycPuYnk10w&oe=675FB895' },
    { name: 'Joya Acel, J', title: 'Assurance Specialist for Quality & Security', image: 'https://scontent.fmnl17-7.fna.fbcdn.net/v/t39.30808-6/465674207_1874496856410441_3163323777184351382_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=nTq_i2Ws3eMQ7kNvgF2CWhz&_nc_zt=23&_nc_ht=scontent.fmnl17-7.fna&_nc_gid=A9rZc54kPj8okByQss6AYXj&oh=00_AYDW0dHGPFDsExdsHGwu7UhFW80GarVPbt76wg_rNvSCcg&oe=675FCEFF' },
    { name: 'Ken L. Palma', title: 'Back-end Developer & Front-end Developer', image: 'https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/462101976_3682236668755453_6560725037198512052_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=JuIAqbvKyeMQ7kNvgErNgOI&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=ANQIbts3yb09Rce0MAWAQqV&oh=00_AYBaUABCt50D8gMTPIp1xo1j58N_wick82Z1ybR_lvuw0w&oe=675FC39A' },
    { name: 'John Anthony Salipot, J', title: 'Release Manager', image: 'https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-1/454657701_1913452269105616_7616436904837231732_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=111&ccb=1-7&_nc_sid=0ecb9b&_nc_ohc=cMhxYkup_acQ7kNvgHb_IBZ&_nc_zt=24&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=AQlDoZeR3N3aHkrrlHmZ10j&oh=00_AYBaSgOqK9agM95SciZOQ7Hzk6OeggorhpMtIibLMdnJjg&oe=675FCF5A' },
    { name: 'John Paul Sauco', title: 'User Insights Specialist', image: '' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.aboutUsContent}>
      <Text style={styles.aboutUsTitle}>Our Team</Text>
      {teamMembers.map((member, index) => (
        <View key={index} style={styles.teamMemberCard}>
          <Image source={{ uri: member.image }} style={styles.teamMemberImage} />
          <View style={styles.teamMemberInfo}>
            <Text style={styles.teamMemberName}>{member.name}</Text>
            <Text style={styles.teamMemberTitle}>{member.title}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const TabContent = ({ title }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [title]);

  const getContent = () => {
    switch (title) {
      case 'Dashboard':
        return (
          <ScrollView contentContainerStyle={styles.homeContent}>
            <WeatherSection />
            <SmartHomeLightingSection />
            <RoomControlsSection />
            <SecurityControlsSection />
          </ScrollView>
        );
      case 'About Us':
        return <AboutUsSection />;

      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      {getContent()}
    </Animated.View>
  );
};

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [userName, setUserName] = useState(''); // Default empty state for userName
  const navigation = useNavigation();
  const [detected, setDetected] = useState(true); // Detect status from Firebase
  const [showNotification, setShowNotification] = useState(false); // Show notification flag

  // Fetch 'detected' state from Firebase Realtime Database
  useEffect(() => {
    const detectedRef = ref(db, 'ultrasonic/detected'); // Path to ultrasonic/detected in Firebase
    const unsubscribe = onValue(detectedRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setDetected(data); // Set the detected state based on Firebase value
      }
    });

    return () => unsubscribe();
  }, []); // Only run once when component mounts

  // Trigger notification when detected state changes
  useEffect(() => {
    if (detected) {
      setShowNotification(true);  // Show notification when detected is true
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptic feedback

      // Optionally hide the notification after 3 seconds
      setTimeout(() => {
        setShowNotification(true);
      }, 3000); // Hide after 3 seconds
    } else {
      setShowNotification(true);  // Hide notification when detected is false
    }
  }, [detected]); // Effect runs every time detected changes

  const notificationHeight = useRef(new Animated.Value(0)).current;
  const notificationOpacity = useRef(new Animated.Value(1)).current;
  const [isMicActive, setIsMicActive] = useState(false);
  
  // Fetch `fname` from Realtime Database
  useEffect(() => {
    const fetchUserName = async () => {
      const userRef = ref(db, 'users'); // Adjust the path if necessary
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserName(data.fname || 'User'); // Set `fname` or fallback to "User"
        } else {
          console.log('No data available');
        }
      } catch (error) {
        console.error('Error fetching fname:', error);
      }
    };
    fetchUserName();
  }, []);  

  useEffect(() => {
    if (showNotification) {
      Animated.parallel([
        Animated.timing(notificationHeight, {
          toValue: 60,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(notificationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();

      const timer = setTimeout(() => {
      hideNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const hideNotification = useCallback(() => {
    Animated.parallel([
      Animated.timing(notificationHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => setShowNotification(false));
  }, []);

  const tabData = [
    { icon: 'home-outline', label: 'Dashboard' },
    { icon: 'people-outline', label: 'About Us' },
  ];

  const handleTabPress = (tab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleMicPress = () => {
    setIsMicActive(!isMicActive);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Here you would typically start or stop voice recognition
    // For now, we'll just toggle the state
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#002f6d', '#001a3d']}
        style={styles.background}
      >
        <Animated.View style={[styles.header, { marginTop: notificationHeight }]}>
          {showNotification && (
            <Animated.View style={[styles.notification, { height: notificationHeight, opacity: notificationOpacity }]}>
              <Text style={styles.notificationText}>Something is detected thru your Door!</Text>
              <TouchableOpacity onPress={hideNotification} style={styles.notificationCloseButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
          <View>
            <Text style={styles.welcomeMessage}>
              {userName ? `Welcome, ${userName}!` : 'Welcome Back!'}
            </Text>
            <Text style={styles.headerTitle}>Smart Home Dashboard</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
        <TabContent title={activeTab} />
        <View style={styles.tabBar}>
          {tabData.map((tab) => (
            <TabButton
              key={tab.label}
              icon={tab.icon}
              label={tab.label}
              isActive={activeTab === tab.label}
              onPress={() => handleTabPress(tab.label)}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.micButton}
          onPress={handleMicPress}
          activeOpacity={0.7}
        >
          <View style={styles.micIconContainer}>
            <Ionicons
              name={isMicActive ? "mic" : "mic-outline"}
              size={28}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  welcomeMessage: {
    fontSize: 22,
    color: '#A0A0A0',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: 10,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabButton: {
    alignItems: 'center',
    padding: 10,
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  tabLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#A0A0A0',
  },
  activeTabLabel: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  homeContent: {
    paddingBottom: 20,
  },
  sectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  weatherHeader: {
    marginBottom: 15,
  },
  weatherName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weatherDate: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherInfo: {
    marginLeft: 20,
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weatherCondition: {
    fontSize: 18,
    color: '#A0A0A0',
    marginBottom: 5,
  },
  weatherDetails: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  lightingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lightingItem: {
    alignItems: 'center',
  },
  lightBulbContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  lightBulbContainerOn: {
    backgroundColor: '#FFD700',
  },
  lightingText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 5,
  },
  lightingStatus: {
    fontSize: 12,
    marginTop: 5,
  },
  roomControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomControlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomControlBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  roomControlBoxOn: {
    backgroundColor: '#0077b6',
  },
  roomControlLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  roomControlIconContainer: {
    marginBottom: 10,
  },
  securityControlsContainer: {
    width: '100%',
  },
  securityControlBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  securityControlContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityControlLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    flex: 1,
    marginLeft: 15,
  },
  securityControlSwipeContainer: {
    width: 150,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    overflow: 'hidden',
  },
  securityControlSwipeBg: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#4a90e2',
  },
  securityControlSwipeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeInstructionText: {
    color: '#A0A0A0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  unlockButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  aboutUsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  aboutUsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  teamMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  teamMemberImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  teamMemberTitle: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  notification: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    width: 500,
    backgroundColor: 'red',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 80,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600, 
    marginLeft: 250,
    marginRight: -50,
    width: 300,
  },
  notificationCloseButton: {
    padding: 5,
  },
  micButton: {
    position: 'absolute',
    bottom: 90, // Adjust this value to position it above the tab bar
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  micIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

