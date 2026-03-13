import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { SizeCategory, DeliverySpeed } from "../../types/database";
import {
  COLORS,
  SIZE_CATEGORY_LABELS,
  DELIVERY_SPEED_LABELS,
} from "../../lib/constants";

export default function CreateScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [title, setTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [numItems, setNumItems] = useState("1");
  const [estimatedWeight, setEstimatedWeight] = useState("");
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>("small");
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed>("standard");
  const [fragile, setFragile] = useState(false);
  const [requiresHelpers, setRequiresHelpers] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Pickup
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupContactName, setPickupContactName] = useState("");
  const [pickupContactPhone, setPickupContactPhone] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  // Dropoff
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffContactName, setDropoffContactName] = useState("");
  const [dropoffContactPhone, setDropoffContactPhone] = useState("");
  const [dropoffNotes, setDropoffNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!user) return;

    if (
      !title.trim() ||
      !itemDescription.trim() ||
      !pickupAddress.trim() ||
      !pickupContactName.trim() ||
      !pickupContactPhone.trim() ||
      !dropoffAddress.trim() ||
      !dropoffContactName.trim() ||
      !dropoffContactPhone.trim()
    ) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    // In production, geocode addresses using a geocoding API.
    // For now, use placeholder coordinates.
    const pickupWindow = new Date();
    const pickupWindowEnd = new Date(pickupWindow.getTime() + 4 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        shipper_id: user.id,
        status: "posted",
        title: title.trim(),
        item_description: itemDescription.trim(),
        num_items: parseInt(numItems, 10) || 1,
        estimated_weight_lbs: estimatedWeight
          ? parseFloat(estimatedWeight)
          : null,
        size_category: sizeCategory,
        delivery_speed: deliverySpeed,
        fragile,
        requires_helpers: requiresHelpers,
        special_instructions: specialInstructions.trim() || null,
        pickup_address: pickupAddress.trim(),
        pickup_lat: 0, // Should be geocoded in production
        pickup_lng: 0,
        pickup_contact_name: pickupContactName.trim(),
        pickup_contact_phone: pickupContactPhone.trim(),
        pickup_notes: pickupNotes.trim() || null,
        dropoff_address: dropoffAddress.trim(),
        dropoff_lat: 0, // Should be geocoded in production
        dropoff_lng: 0,
        dropoff_contact_name: dropoffContactName.trim(),
        dropoff_contact_phone: dropoffContactPhone.trim(),
        dropoff_notes: dropoffNotes.trim() || null,
        pickup_window_start: pickupWindow.toISOString(),
        pickup_window_end: pickupWindowEnd.toISOString(),
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Shipment Created", "Your shipment has been posted. Drivers will start quoting soon.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Home", { screen: "HomeMain" }),
        },
      ]);
      // Reset form
      setTitle("");
      setItemDescription("");
      setNumItems("1");
      setEstimatedWeight("");
      setSizeCategory("small");
      setDeliverySpeed("standard");
      setFragile(false);
      setRequiresHelpers(false);
      setSpecialInstructions("");
      setPickupAddress("");
      setPickupContactName("");
      setPickupContactPhone("");
      setPickupNotes("");
      setDropoffAddress("");
      setDropoffContactName("");
      setDropoffContactPhone("");
      setDropoffNotes("");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Create Shipment</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Item Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Details</Text>

            <Text style={styles.label}>Shipment Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Office furniture delivery"
              placeholderTextColor={COLORS.gray400}
              value={title}
              onChangeText={setTitle}
              editable={!submitting}
            />

            <Text style={styles.label}>Item Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the items being shipped"
              placeholderTextColor={COLORS.gray400}
              value={itemDescription}
              onChangeText={setItemDescription}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Number of Items</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={COLORS.gray400}
                  value={numItems}
                  onChangeText={setNumItems}
                  keyboardType="number-pad"
                  editable={!submitting}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Est. Weight (lbs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  placeholderTextColor={COLORS.gray400}
                  value={estimatedWeight}
                  onChangeText={setEstimatedWeight}
                  keyboardType="decimal-pad"
                  editable={!submitting}
                />
              </View>
            </View>

            <Text style={styles.label}>Size Category</Text>
            <View style={styles.chipRow}>
              {(
                Object.entries(SIZE_CATEGORY_LABELS) as [SizeCategory, string][]
              ).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.chip,
                    sizeCategory === key && styles.chipActive,
                  ]}
                  onPress={() => setSizeCategory(key)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.chipText,
                      sizeCategory === key && styles.chipTextActive,
                    ]}
                  >
                    {label.split(" (")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Delivery Speed</Text>
            <View style={styles.chipRow}>
              {(
                Object.entries(DELIVERY_SPEED_LABELS) as [
                  DeliverySpeed,
                  string,
                ][]
              ).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.chip,
                    deliverySpeed === key && styles.chipActive,
                  ]}
                  onPress={() => setDeliverySpeed(key)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.chipText,
                      deliverySpeed === key && styles.chipTextActive,
                    ]}
                  >
                    {label.split(" (")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Fragile Items</Text>
              <Switch
                value={fragile}
                onValueChange={setFragile}
                trackColor={{ false: COLORS.gray300, true: COLORS.blue }}
                thumbColor={COLORS.white}
                disabled={submitting}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Requires Helpers</Text>
              <Switch
                value={requiresHelpers}
                onValueChange={setRequiresHelpers}
                trackColor={{ false: COLORS.gray300, true: COLORS.blue }}
                thumbColor={COLORS.white}
                disabled={submitting}
              />
            </View>
          </View>

          {/* Pickup Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Details</Text>

            <Text style={styles.label}>Pickup Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full address"
              placeholderTextColor={COLORS.gray400}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              editable={!submitting}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Contact Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={COLORS.gray400}
                  value={pickupContactName}
                  onChangeText={setPickupContactName}
                  editable={!submitting}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Contact Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  placeholderTextColor={COLORS.gray400}
                  value={pickupContactPhone}
                  onChangeText={setPickupContactPhone}
                  keyboardType="phone-pad"
                  editable={!submitting}
                />
              </View>
            </View>

            <Text style={styles.label}>Pickup Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Gate code, dock number, etc."
              placeholderTextColor={COLORS.gray400}
              value={pickupNotes}
              onChangeText={setPickupNotes}
              editable={!submitting}
            />
          </View>

          {/* Dropoff Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dropoff Details</Text>

            <Text style={styles.label}>Dropoff Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full address"
              placeholderTextColor={COLORS.gray400}
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
              editable={!submitting}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Contact Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={COLORS.gray400}
                  value={dropoffContactName}
                  onChangeText={setDropoffContactName}
                  editable={!submitting}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Contact Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  placeholderTextColor={COLORS.gray400}
                  value={dropoffContactPhone}
                  onChangeText={setDropoffContactPhone}
                  keyboardType="phone-pad"
                  editable={!submitting}
                />
              </View>
            </View>

            <Text style={styles.label}>Dropoff Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Loading dock, apartment number, etc."
              placeholderTextColor={COLORS.gray400}
              value={dropoffNotes}
              onChangeText={setDropoffNotes}
              editable={!submitting}
            />
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <Text style={styles.label}>Special Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any other details the driver should know"
              placeholderTextColor={COLORS.gray400}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Post Shipment</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  flex: {
    flex: 1,
  },
  screenHeader: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.navy,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.navy,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  chipActive: {
    backgroundColor: COLORS.blueLight,
    borderColor: COLORS.blue,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  chipTextActive: {
    color: COLORS.blue,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 40,
  },
});
