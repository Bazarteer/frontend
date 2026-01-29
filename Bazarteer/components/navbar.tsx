import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar = ({ activeTab = 'home' }: { activeTab?: string }) => {
  const {user} = useAuth()
  return (
    <View style={navbarStyles.navbar}>
      <TouchableOpacity
        style={navbarStyles.navItem}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons
          name="home"
          size={28}
          color={activeTab === 'home' ? '#000000' : '#666666'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={navbarStyles.navItem}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Ionicons
          name="car"
          size={28}
          color={activeTab === 'orders' ? '#000000' : '#666666'}
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={navbarStyles.navItemAdd}
        onPress={() => router.push('/(tabs)/add')}>
        <View style={navbarStyles.addButton}>
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={navbarStyles.navItem}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Ionicons
          name="notifications"
          size={28}
          color={activeTab === 'notifications' ? '#000000' : '#666666'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={navbarStyles.navItem}
        onPress={() => router.push(`/(tabs)/profile/0`)}
      >
        <Ionicons
          name="person"
          size={28}
          color={activeTab === 'profile' ? '#000000' : '#666666'}
        />
      </TouchableOpacity>
    </View>
  );
};

const navbarStyles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemAdd: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});