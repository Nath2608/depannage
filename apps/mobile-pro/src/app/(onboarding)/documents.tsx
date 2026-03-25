import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button, Input, Card } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { api } from '@services/api';

interface DocumentState {
  uri: string | null;
  uploading: boolean;
  uploaded: boolean;
}

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Record<string, DocumentState>>({
    idCardFront: { uri: null, uploading: false, uploaded: false },
    idCardBack: { uri: null, uploading: false, uploaded: false },
    proofOfAddress: { uri: null, uploading: false, uploaded: false },
    insurance: { uri: null, uploading: false, uploaded: false },
  });
  const [siretNumber, setSiretNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickDocument = async (type: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDocuments((prev) => ({
        ...prev,
        [type]: { ...prev[type], uri: result.assets[0].uri },
      }));
    }
  };

  const takePhoto = async (type: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la caméra nécessaire');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDocuments((prev) => ({
        ...prev,
        [type]: { ...prev[type], uri: result.assets[0].uri },
      }));
    }
  };

  const showDocumentOptions = (type: string, title: string) => {
    Alert.alert(title, 'Choisissez une option', [
      { text: 'Prendre une photo', onPress: () => takePhoto(type) },
      { text: 'Choisir dans la galerie', onPress: () => pickDocument(type) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const validateSiret = (siret: string) => {
    return /^\d{14}$/.test(siret.replace(/\s/g, ''));
  };

  const handleSubmit = async () => {
    const allDocumentsSelected = Object.values(documents).every((doc) => doc.uri);

    if (!allDocumentsSelected) {
      Alert.alert('Documents manquants', 'Veuillez ajouter tous les documents requis');
      return;
    }

    if (!validateSiret(siretNumber)) {
      Alert.alert('SIRET invalide', 'Le numéro SIRET doit contenir 14 chiffres');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload each document
      for (const [type, doc] of Object.entries(documents)) {
        if (doc.uri) {
          await api.onboarding.uploadDocument(type, doc.uri);
          setDocuments((prev) => ({
            ...prev,
            [type]: { ...prev[type], uploaded: true },
          }));
        }
      }

      // Submit all documents
      await api.onboarding.submitDocuments({
        idCardFront: documents.idCardFront.uri!,
        idCardBack: documents.idCardBack.uri!,
        proofOfAddress: documents.proofOfAddress.uri!,
        insurance: documents.insurance.uri!,
        qualifications: [],
        siretNumber: siretNumber.replace(/\s/g, ''),
        companyName: companyName || undefined,
      });

      router.push('/(onboarding)/service-area');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentItems = [
    { key: 'idCardFront', label: 'Carte d\'identité (recto)', icon: 'card' },
    { key: 'idCardBack', label: 'Carte d\'identité (verso)', icon: 'card-outline' },
    { key: 'proofOfAddress', label: 'Justificatif de domicile', icon: 'home' },
    { key: 'insurance', label: 'Attestation RC Pro', icon: 'shield-checkmark' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Documents requis</Text>
          <Text style={styles.subtitle}>
            Ces documents sont nécessaires pour valider votre inscription
          </Text>
        </View>

        <View style={styles.documentsSection}>
          {documentItems.map((item) => (
            <Pressable
              key={item.key}
              style={[
                styles.documentCard,
                documents[item.key].uri && styles.documentCardSelected,
              ]}
              onPress={() => showDocumentOptions(item.key, item.label)}
            >
              <View style={styles.documentIcon}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={documents[item.key].uri ? Colors.light.success : Colors.light.textSecondary}
                />
              </View>
              <View style={styles.documentContent}>
                <Text style={styles.documentLabel}>{item.label}</Text>
                <Text style={styles.documentStatus}>
                  {documents[item.key].uri ? 'Document ajouté' : 'Appuyez pour ajouter'}
                </Text>
              </View>
              {documents[item.key].uri ? (
                <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
              ) : (
                <Ionicons name="add-circle" size={24} color={Colors.light.primary} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations entreprise</Text>

          <Input
            label="Numéro SIRET"
            placeholder="123 456 789 00012"
            value={siretNumber}
            onChangeText={setSiretNumber}
            keyboardType="number-pad"
            leftIcon="business-outline"
          />

          <Input
            label="Nom de l'entreprise (optionnel)"
            placeholder="Ma Société"
            value={companyName}
            onChangeText={setCompanyName}
            leftIcon="briefcase-outline"
          />
        </View>

        <Button
          title="Continuer"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!Object.values(documents).every((doc) => doc.uri) || !siretNumber}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  documentsSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  documentCardSelected: {
    borderColor: Colors.light.success,
    backgroundColor: Colors.light.successLight + '30',
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  documentContent: {
    flex: 1,
  },
  documentLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.light.text,
  },
  documentStatus: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginBottom: Spacing.lg,
  },
});
