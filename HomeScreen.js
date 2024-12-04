import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
  Switch,
  PanResponder,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';


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

const WeatherSection = () => {
  const weatherData = {
    temperature: 72,
    condition: 'Partly Cloudy',
    icon: 'partly-sunny-outline',
    location: 'New York, NY',
    humidity: '65%',
    windSpeed: '8 mph',
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.weatherHeader}>
        <Text style={styles.weatherLocation}>{weatherData.location}</Text>
        <Text style={styles.weatherDate}>{formattedDate}</Text>
      </View>
      <View style={styles.weatherContent}>
        <Ionicons name={weatherData.icon} size={80} color="#4a90e2" />
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherTemp}>{weatherData.temperature}°F</Text>
          <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
          <Text style={styles.weatherDetails}>Humidity: {weatherData.humidity}</Text>
          <Text style={styles.weatherDetails}>Wind: {weatherData.windSpeed}</Text>
        </View>
      </View>
    </View>
  );
};

const SmartHomeLightingSection = () => {
  const [lights, setLights] = useState({
    livingRoom: true,
    bedroom: false,
    kitchen: true,
  });

  const toggleLight = (room) => {
    setLights(prevLights => ({
      ...prevLights,
      [room]: !prevLights[room]
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const LightItem = ({ room, isOn }) => (
    <TouchableOpacity 
      style={styles.lightingItem} 
      onPress={() => toggleLight(room)}
      activeOpacity={0.7}
    >
      <View style={[styles.lightBulbContainer, isOn && styles.lightBulbContainerOn]}>
        <Ionicons 
          name={isOn ? "bulb" : "bulb-outline"} 
          size={40} 
          color={isOn ? '#FFFFFF' : '#A0A0A0'} 
        />
      </View>
      <Text style={styles.lightingText}>{room}</Text>
      <Text style={[styles.lightingStatus, { color: isOn ? '#4a90e2' : '#A0A0A0' }]}>
        {isOn ? 'On' : 'Off'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Smart Home Lighting</Text>
      <View style={styles.lightingContent}>
        <LightItem room="Living Room" isOn={lights.livingRoom} />
        <LightItem room="Bedroom" isOn={lights.bedroom} />
        <LightItem room="Kitchen" isOn={lights.kitchen} />
      </View>
    </View>
  );
};

const RoomControlsSection = () => {
  const [roomLights, setRoomLights] = useState({
    firstFloorLiving: false,
    firstFloorBedroom: false,
    secondFloorLiving: false,
    secondFloorBedroom: false,
  });

  const toggleLight = (room) => {
    setRoomLights(prevLights => ({
      ...prevLights,
      [room]: !prevLights[room]
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <Text style={styles.sectionTitle}>Room Controls</Text>
      <View style={styles.roomControlsGrid}>
        <RoomControl room="firstFloorLiving" label="1st Floor Living" icon="home-outline" />
        <RoomControl room="firstFloorBedroom" label="1st Floor Bedroom" icon="bed-outline" />
        <RoomControl room="secondFloorLiving" label="2nd Floor Living" icon="tv-outline" />
        <RoomControl room="secondFloorBedroom" label="2nd Floor Bedroom" icon="moon-outline" />
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
    setSecurityStatus(prevStatus => ({
      ...prevStatus,
      [item]: !prevStatus[item]
    }));
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
          <Text style={styles.swipeInstructionText}>Swipe to lock</Text>
        )}
        {securityStatus[item] && (
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={() => toggleLock(item)}
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
    { name: 'John Doe', title: 'CEO', image: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Jane Smith', title: 'CTO', image: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Mike Johnson', title: 'Lead Developer', image: 'https://i.pravatar.cc/150?img=3' },
    { name: 'Emily Brown', title: 'UX Designer', image: 'https://i.pravatar.cc/150?img=4' },
    { name: 'David Lee', title: 'Product Manager', image: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Sarah Wilson', title: 'Marketing Director', image: 'https://i.pravatar.cc/150?img=6' },
    { name: 'Chris Taylor', title: 'Sales Manager', image: 'https://i.pravatar.cc/150?img=7' },
    { name: 'Lisa Chen', title: 'Customer Support Lead', image: 'https://i.pravatar.cc/150?img=8' },
    { name: 'Alex Rodriguez', title: 'QA Engineer', image: 'https://i.pravatar.cc/150?img=9' },
    { name: 'Olivia Kim', title: 'Data Scientist', image: 'https://i.pravatar.cc/150?img=10' },
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

        
      case 'Profile':
        return (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderTitle}>Profile</Text>
            <Text style={styles.placeholderText}>Manage your account settings.</Text>
          </View>
        );
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
  const navigation = useNavigation();

  const userName = "John";

  const tabData = [
    { icon: 'home-outline', label: 'Dashboard' },
    { icon: 'people-outline', label: 'About Us' },
    { icon: 'person-outline', label: 'Profile' },
  ];

  const handleTabPress = (tab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#002f6d', '#001a3d']}
        style={styles.background}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeMessage}>
              {userName ? `Welcome, ${userName}!` : 'Welcome Back!'}
            </Text>
            <Text style={styles.headerTitle}>Smart Home Dashboard</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
  weatherLocation: {
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
    backgroundColor: '#4a90e2',
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
});

