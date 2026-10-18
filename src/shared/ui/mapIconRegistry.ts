import { FaSchool, FaHospital, FaBus, FaTrain, FaTree, FaHome, FaUniversity,
  FaShoppingCart, FaParking, FaPaw, FaCoffee, FaBicycle, FaMapMarkerAlt } from 'react-icons/fa';
import type { IconType } from 'react-icons';

// Extend this explicit registry when adding a named icon in fields_config.
// Emoji remain supported; unknown names render as escaped text.
export const MAP_ICONS: Readonly<Record<string, IconType>> = {
  FaSchool, FaHospital, FaBus, FaTrain, FaTree, FaHome, FaUniversity,
  FaShoppingCart, FaParking, FaPaw, FaCoffee, FaBicycle, FaMapMarkerAlt,
};
