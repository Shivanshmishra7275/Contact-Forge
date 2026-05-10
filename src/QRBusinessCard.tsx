/**
 * ContactForge — QR Business Card Component
 * Generate and display user's contact QR code
 * 
 * Created by: T.G.S Mishra
 * Part of ContactForge Phase 8 Premium Cinematic Upgrade
 * 
 * Features:
 * - Generate VCF QR codes locally (offline)
 * - Display user profile information
 * - Share QR as image
 * - Professional card layout
 */

import { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Share } from 'react-native';
import { Text, Button, Card, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { 
  getMyProfileCard, 
  createOrUpdateProfileCard, 
  getProfileCardAsVCF 
} from '../db/repositories/profileCardRepository';
import { COLORS, SPACING, FONT_SIZE } from '../constants';
import type { ProfileCard } from '../types';

interface QRCardProps {
  onClose: () => void;
}

/**
 * QRBusinessCard Component
 * 
 * Displays and manages user's QR business card:
 * - Edit profile information
 * - Generate QR code from VCF data
 * - Share QR code
 * - Fully offline operation
 */
export function QRBusinessCard({ onClose }: QRCardProps) {
  const [profile, setProfile] = useState<ProfileCard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [qrValue, setQrValue] = useState('');

  /**
   * Load existing profile on mount
   */
  useEffect(() => {
    const existingProfile = getMyProfileCard();
    if (existingProfile) {
      setProfile(existingProfile);
      setName(existingProfile.displayName);
      setTitle(existingProfile.title || '');
      setPhone(existingProfile.phone || '');
      setEmail(existingProfile.email || '');
      setCompany(existingProfile.company || '');
      setWebsite(existingProfile.website || '');
      // Generate VCF and QR value
      const vcf = getProfileCardAsVCF(existingProfile);
      setQrValue(vcf);
    }
  }, []);

  /**
   * Save profile and regenerate QR
   * - Creates or updates profile
   * - Generates VCF string
   * - Triggers QR regeneration
   */
  const handleSaveProfile = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    const updatedProfile = createOrUpdateProfileCard({
      displayName: name,
      title: title || null,
      phone: phone || null,
      email: email || null,
      company: company || null,
      website: website || null,
    });

    setProfile(updatedProfile);
    const vcf = getProfileCardAsVCF(updatedProfile);
    setQrValue(vcf);
    setIsEditing(false);
    Alert.alert('Saved', 'Profile updated successfully');
  }, [name, title, phone, email, company, website]);

  /**
   * Share QR code
   * - Uses native share sheet
   * - Fully offline operation
   */
  const handleShare = useCallback(async () => {
    if (!profile) return;
    try {
      await Share.share({
        message: `Here's my contact: ${profile.displayName}\n\nVCard:\n${qrValue}`,
        title: `${profile.displayName} - Contact Card`,
        url: 'data:text/vcard;base64,' + Buffer.from(qrValue).toString('base64'),
      });
    } catch (error) {
      Alert.alert('Share failed', 'Could not share QR code');
    }
  }, [profile, qrValue]);

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile Card</Text>
          <Button onPress={() => setIsEditing(false)} icon="close">Cancel</Button>
        </View>

        <View style={styles.form}>
          {/* Name input */}
          <TextInput
            label="Full Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.textPrimary}
          />

          {/* Title input */}
          <TextInput
            label="Professional Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.textPrimary}
          />

          {/* Company input */}
          <TextInput
            label="Company"
            value={company}
            onChangeText={setCompany}
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.textPrimary}
          />

          {/* Phone input */}
          <TextInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.textPrimary}
          />

          {/* Email input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.textPrimary}
          />

          {/* Website input */}
          <TextInput
            label="Website"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.textPrimary}
          />

          {/* Save button */}
          <Button
            mode="contained"
            onPress={handleSaveProfile}
            style={styles.saveBtn}
            buttonColor={COLORS.primary}
          >
            Save & Generate QR
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Business Card</Text>
        <Button onPress={onClose} icon="close">Close</Button>
      </View>

      {/* Card Display */}
      <View style={styles.cardDisplay}>
        {profile ? (
          <Card style={styles.card}>
            <Card.Content>
              {/* Profile info section */}
              <View style={styles.profileInfo}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="account" size={40} color={COLORS.primary} />
                </View>
                <View style={styles.profileText}>
                  <Text style={styles.profileName}>{profile.displayName}</Text>
                  {profile.title && <Text style={styles.profileTitle}>{profile.title}</Text>}
                  {profile.company && <Text style={styles.profileCompany}>{profile.company}</Text>}
                </View>
              </View>

              {/* Contact info section */}
              {(profile.phone || profile.email || profile.website) && (
                <View style={styles.contactInfo}>
                  {profile.phone && (
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="phone" size={16} color={COLORS.secondary} />
                      <Text style={styles.infoText}>{profile.phone}</Text>
                    </View>
                  )}
                  {profile.email && (
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="email" size={16} color={COLORS.secondary} />
                      <Text style={styles.infoText}>{profile.email}</Text>
                    </View>
                  )}
                  {profile.website && (
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="web" size={16} color={COLORS.secondary} />
                      <Text style={styles.infoText}>{profile.website}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* QR Code section */}
              {qrValue && (
                <View style={styles.qrSection}>
                  <Text style={styles.qrLabel}>Share This QR Code:</Text>
                  <View style={styles.qrContainer}>
                    <QRCode
                      value={qrValue}
                      size={200}
                      color={COLORS.textPrimary}
                      backgroundColor={COLORS.background}
                    />
                  </View>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => setIsEditing(true)}
                  textColor={COLORS.primary}
                  icon="pencil"
                >
                  Edit
                </Button>
                <Button
                  mode="contained"
                  onPress={handleShare}
                  buttonColor={COLORS.primary}
                  icon="share"
                >
                  Share
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.noProfile}>No profile card yet.</Text>
              <Text style={styles.noProfileDesc}>Create one by tapping Edit below.</Text>
              <Button
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={styles.createBtn}
                buttonColor={COLORS.primary}
              >
                Create Profile Card
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm 
  },
  title: { 
    color: COLORS.primary, 
    fontSize: FONT_SIZE.lg, 
    fontWeight: '700' 
  },
  form: { 
    padding: SPACING.md, 
    gap: SPACING.sm 
  },
  input: { 
    backgroundColor: COLORS.surface, 
    marginBottom: SPACING.sm 
  },
  saveBtn: { marginTop: SPACING.md },
  cardDisplay: { 
    flex: 1, 
    padding: SPACING.md, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  card: { 
    backgroundColor: COLORS.surface, 
    width: '100%' 
  },
  profileInfo: { 
    flexDirection: 'row', 
    gap: SPACING.md, 
    marginBottom: SPACING.md, 
    alignItems: 'center' 
  },
  avatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: COLORS.surfaceVariant, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  profileText: { flex: 1 },
  profileName: { 
    color: COLORS.textPrimary, 
    fontSize: FONT_SIZE.lg, 
    fontWeight: '700' 
  },
  profileTitle: { 
    color: COLORS.textSecondary, 
    fontSize: FONT_SIZE.sm, 
    marginTop: 2 
  },
  profileCompany: { 
    color: COLORS.textDisabled, 
    fontSize: FONT_SIZE.xs, 
    marginTop: 2 
  },
  contactInfo: { 
    gap: SPACING.xs, 
    marginBottom: SPACING.md, 
    paddingVertical: SPACING.sm, 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: COLORS.divider 
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm 
  },
  infoText: { 
    color: COLORS.textSecondary, 
    fontSize: FONT_SIZE.sm 
  },
  qrSection: { 
    alignItems: 'center', 
    marginVertical: SPACING.md 
  },
  qrLabel: { 
    color: COLORS.textSecondary, 
    fontSize: FONT_SIZE.sm, 
    marginBottom: SPACING.md 
  },
  qrContainer: { 
    padding: SPACING.md, 
    backgroundColor: COLORS.background, 
    borderRadius: 12 
  },
  actions: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginTop: SPACING.md 
  },
  noProfile: { 
    color: COLORS.textSecondary, 
    fontSize: FONT_SIZE.md, 
    textAlign: 'center', 
    marginBottom: SPACING.sm 
  },
  noProfileDesc: { 
    color: COLORS.textDisabled, 
    fontSize: FONT_SIZE.sm, 
    textAlign: 'center', 
    marginBottom: SPACING.md 
  },
  createBtn: { marginTop: SPACING.md },
});
