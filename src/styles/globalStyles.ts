import { StyleSheet, TextStyle } from 'react-native';
import { fontFamily } from '../config/fonts';

// Global text styles using Inter Tight
export const globalTextStyles = StyleSheet.create({
  // Base text styles
  text: {
    fontFamily: fontFamily.regular,
    color: '#333333',
  } as TextStyle,
  
  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    fontWeight: '700',
    color: '#333333',
  } as TextStyle,
  
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
  } as TextStyle,
  
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  } as TextStyle,
  
  h4: {
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  } as TextStyle,
  
  h5: {
    fontFamily: fontFamily.medium,
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
  } as TextStyle,
  
  h6: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  } as TextStyle,
  
  // Body text
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: '#333333',
  } as TextStyle,
  
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: '#666666',
  } as TextStyle,
  
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#888888',
  } as TextStyle,
  
  // Button text
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  
  buttonSmall: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
  
  // Navigation
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
  } as TextStyle,
  
  // Special styles
  bold: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  } as TextStyle,
  
  semiBold: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  } as TextStyle,
  
  medium: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
  } as TextStyle,
  
  light: {
    fontFamily: fontFamily.light,
    fontWeight: '300',
  } as TextStyle,
});

// Helper function to apply global font to any text style
export const withGlobalFont = (style: TextStyle = {}): TextStyle => ({
  fontFamily: fontFamily.regular,
  ...style,
}); 