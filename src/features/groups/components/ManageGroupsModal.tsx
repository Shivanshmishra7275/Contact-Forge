import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Pressable, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GroupRepository } from '../../../db/repositories/groupRepository';
import { Group } from '../../../types';

const COLORS = {
  background: '#05050A',
  surface: 'rgba(20, 20, 30, 0.7)',
  surfaceElevated: 'rgba(30, 30, 45, 0.8)',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.1)',
  error: '#f43f5e',
  cyan: '#06b6d4',
  purple: '#a855f7',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
};

const PRESET_COLORS = [COLORS.cyan, COLORS.purple, COLORS.emerald, COLORS.rose, COLORS.amber];

interface Props {
  visible: boolean;
  onClose: () => void;
  onGroupsUpdated?: () => void;
}

export function ManageGroupsModal({ visible, onClose, onGroupsUpdated }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Animation values
  const translateY = useSharedValue(1000);
  const opacity = useSharedValue(0);

  const loadGroups = () => {
    const data = GroupRepository.getAllGroups();
    setGroups(data);
  };

  useEffect(() => {
    if (visible) {
      loadGroups();
      setErrorMsg(null);
      setEditingGroupId(null);
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withSpring(1000, { damping: 20, stiffness: 90 });
    }
  }, [visible]);

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 250 });
    translateY.value = withSpring(1000, { damping: 20, stiffness: 90 }, () => {
      runOnJS(onClose)();
    });
  };

  const handleCreateGroup = () => {
    setErrorMsg(null);
    if (!newGroupName.trim()) return;
    try {
      GroupRepository.createGroup(newGroupName.trim(), selectedColor);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewGroupName('');
      loadGroups();
      if (onGroupsUpdated) onGroupsUpdated();
    } catch (error: any) {
      console.error('Failed to create group:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error.message && error.message.includes('UNIQUE')) {
        setErrorMsg('A tag with this name already exists.');
      } else {
        setErrorMsg('Failed to create tag. Please try again.');
      }
    }
  };

  const handleSaveEdit = (group: Group) => {
    if (!editName.trim()) {
      setEditingGroupId(null);
      return;
    }
    try {
      GroupRepository.updateGroup(group.id, editName.trim(), group.color);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEditingGroupId(null);
      loadGroups();
      if (onGroupsUpdated) onGroupsUpdated();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not rename. This name might already exist.');
    }
  };

  const handleDeleteGroup = (group: Group) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete "${group.name}"? Contacts assigned to this tag will not be deleted, but the tag will be removed from them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            GroupRepository.deleteGroup(group.id);
            loadGroups();
            if (onGroupsUpdated) onGroupsUpdated();
          }
        }
      ]
    );
  };

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, animatedOverlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.content, animatedContentStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Tags</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.createSection}>
            <Text style={styles.sectionLabel}>Create New Tag</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Investors, VIP"
                placeholderTextColor={COLORS.textSecondary}
                value={newGroupName}
                onChangeText={(txt) => { setNewGroupName(txt); setErrorMsg(null); }}
                onSubmitEditing={handleCreateGroup}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: newGroupName.trim() ? COLORS.cyan : COLORS.surfaceElevated }]}
                onPress={handleCreateGroup}
                disabled={!newGroupName.trim()}
              >
                <Ionicons name="add" size={20} color={newGroupName.trim() ? '#000' : COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            <View style={styles.colorPicker}>
              {PRESET_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorCircleSelected
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionLabel}>Existing Tags</Text>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {groups.length === 0 ? (
                <Text style={styles.emptyText}>No tags created yet.</Text>
              ) : (
                groups.map(group => {
                  const isEditing = editingGroupId === group.id;
                  return (
                    <View key={group.id} style={styles.groupRow}>
                      <View style={styles.groupBadgeContainer}>
                        <View style={[styles.colorIndicator, { backgroundColor: group.color, shadowColor: group.color }]} />
                        {isEditing ? (
                          <TextInput
                            style={styles.editInput}
                            value={editName}
                            onChangeText={setEditName}
                            autoFocus
                            onSubmitEditing={() => handleSaveEdit(group)}
                            onBlur={() => handleSaveEdit(group)}
                            returnKeyType="done"
                          />
                        ) : (
                          <TouchableOpacity onPress={() => { setEditingGroupId(group.id); setEditName(group.name); }} style={{ flex: 1 }}>
                            <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {!isEditing && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity onPress={() => { setEditingGroupId(group.id); setEditName(group.name); }} style={styles.actionBtn}>
                            <Ionicons name="pencil" size={18} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteGroup(group)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={18} color={COLORS.rose} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  createSection: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    opacity: 0.6,
  },
  colorCircleSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  listSection: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  groupName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  editInput: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cyan,
    padding: 0,
    margin: 0,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
  },
});
