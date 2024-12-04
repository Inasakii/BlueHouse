import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Firebase signup method

import { auth } from './firebase'; 
import { ref, set } from 'firebase/database'; // Realtime Database functions
import { db } from './firebase'; // Import the corrected Realtime Database instance

const { width, height } = Dimensions.get('window');

const PasswordStrengthIndicator = ({ password }) => {
  const getStrength = (pass) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) score++;
    if (pass.match(/\d/)) score++;
    if (pass.match(/[^a-zA-Z\d]/)) score++;
    return score;
  };

  const strength = getStrength(password);
  const widthPercentage = (strength / 4) * 100;

  return (
    <View style={styles.strengthContainer}>
      <Animated.View
        style={[
          styles.strengthIndicator,
          { width: `${widthPercentage}%` },
          {
            backgroundColor:
              strength === 0 ? '#FF3B30' :
              strength < 2 ? '#FF9500' :
              strength < 4 ? '#34C759' : '#007AFF'
          }
        ]}
      />
    </View>
  );
};

const FeedbackModal = ({ visible, type, message, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons
            name={type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={50}
            color={type === 'success' ? '#34C759' : '#FF3B30'}
          />
          <Text style={styles.modalText}>{message}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fname, setFname] = useState(''); 
  const [lname, setLname] = useState(''); 
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [fadeAnim, slideAnim]);

  const validateEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSignUp = async () => {
    if (!fname || !lname) {
      showModal('error', 'Please enter your first and last name');
      shakeInput();
      return;
    }
  
    if (email.trim() === '' || password.trim() === '' || confirmPassword.trim() === '') {
      showModal('error', 'Please fill in all fields');
      shakeInput();
      return;
    }
    if (!validateEmail(email)) {
      showModal('error', 'Please enter a valid email address');
      shakeInput();
      return;
    }
    if (password.length < 6) {
      showModal('error', 'Password must be at least 6 characters long');
      shakeInput();
      return;
    }
    if (password !== confirmPassword) {
      showModal('error', 'Passwords do not match');
      shakeInput();
      return;
    }
  
    try {
      // Firebase Auth sign-up
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Save user details to Firebase Realtime Database
      await set(ref(db, `users/${user.uid}`), {
        fname: fname,
        lname: lname,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
  
      showModal('success', 'Sign up successful!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showModal('error', `Error: ${error.message}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  const showModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  const shakeInput = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#002f6d', '#001a3d']}
          style={styles.background}
        />
        <View style={styles.patternOverlay} />
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Animated.View style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            {!isKeyboardVisible && (
              <View style={styles.logoContainer}>
                <Image
                  source={{ uri: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.com-logo1.png' }}
                  style={styles.logo}
                />
              </View>
            )}
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          

            <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
            <View style={styles.nameInputContainer}>
              <View style={[styles.inputWrapper, styles.firstNameInput]}>
                  <TextInput
                      style={styles.input}
                      placeholder="First name"
                      placeholderTextColor="#A0A0A0"
                      value={fname} // Bind fname state
                      onChangeText={setFname} // Update fname state
                      keyboardType="default"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={[styles.inputWrapper, styles.lastNameInput]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      placeholderTextColor="#A0A0A0"
                      value={lname} // Bind lname state
                      onChangeText={setLname} // Update lname state
                      keyboardType="default"
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={24} color="#FFFFFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={24} color="#FFFFFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={24} color="#FFFFFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#A0A0A0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
            <PasswordStrengthIndicator password={password} />
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you accept our{' '}
                <Text style={styles.termsLink} onPress={() => showModal('info', 'Showing Terms of Service...')}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={styles.termsLink} onPress={() => showModal('info', 'Showing Privacy Policy...')}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
        <FeedbackModal
          visible={modalVisible}
          type={modalType}
          message={modalMessage}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  patternOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
    opacity: 0.03,
    backgroundColor: '#FFFFFF',
    backgroundImage: 'radial-gradient(circle at 2px 2px, #FFFFFF 1px, transparent 0)',
    backgroundSize: '20px 20px',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#A0A0A0',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  nameInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  firstNameInput: {
    flex: 1,
    marginRight: 10, // Space between first name and last name
  },
  lastNameInput: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 15,
    paddingRight: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  strengthContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 15,
  },
  strengthIndicator: {
    height: '100%',
    borderRadius: 2,
  },
  signUpButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  signUpButtonText: {
    color: '#002f6d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  termsText: {
    color: '#A0A0A0',
    fontSize: 12,
    textAlign: 'center',
  },
  termsLink: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#A0A0A0',
    fontSize: 16,
  },
  loginLink: {
    color: '#002f6d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    color: '#333333',
    marginVertical: 15,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#002f6d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

