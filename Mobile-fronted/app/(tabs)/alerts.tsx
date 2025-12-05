import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  AlertTriangle,
  Shield,
  Bell,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  Filter,
  Download,
  Eye,
  Thermometer,
  Syringe,
  Heart,
  Activity,
  ChevronRight,
  Calendar,
  BarChart2
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { router, useLocalSearchParams } from "expo-router";
import Papa from "papaparse";

export interface AlertItem {
  Type: string;
  MonthYear: string;
  LocationsEffected: string;
  DiseaseName: string;
  UpdatedDate: string;
  UpdatedOn: string;
  DiseaseOverview: string;
  PossiblePreventiveMeasure: string;
}

// Extended interface for internal use
interface AlertData extends AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  status: "active" | "investigating" | "scheduled" | "resolved";
  timeAgo: string;
  priority: number;
}

type Props = {
  data?: AlertItem[];
};

// Types for navigation
type RootStackParamList = {
  RiskAssessmentTest: undefined;
  RiskAssessmentResults: { assessmentData: any };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// // Mock data matching your Google Sheets structure
// const MOCK_ALERTS_DATA: AlertItem[] = [
//   {
//     Type: "Critical",
//     MonthYear: "Dec 2024",
//     LocationsEffected: "Pig Pen 2, Broiler House 1",
//     DiseaseName: "African Swine Fever",
//     UpdatedDate: "2024-12-15",
//     UpdatedOn: "10:30 AM",
//     DiseaseOverview: "High mortality rate detected in pigs with symptoms of high fever, loss of appetite, and hemorrhages.",
//     PossiblePreventiveMeasure: "Strict biosecurity measures, quarantine affected animals, disinfect premises"
//   },
//   {
//     Type: "Warning",
//     MonthYear: "Dec 2024",
//     LocationsEffected: "Layer House 3",
//     DiseaseName: "Avian Influenza",
//     UpdatedDate: "2024-12-14",
//     UpdatedOn: "2:15 PM",
//     DiseaseOverview: "Moderate respiratory symptoms observed in laying hens with reduced egg production.",
//     PossiblePreventiveMeasure: "Isolate sick birds, enhance ventilation, monitor temperature"
//   },
//   {
//     Type: "Critical",
//     MonthYear: "Dec 2024",
//     LocationsEffected: "Feed Storage Area",
//     DiseaseName: "Aflatoxin Contamination",
//     UpdatedDate: "2024-12-13",
//     UpdatedOn: "9:00 AM",
//     DiseaseOverview: "Feed samples show high levels of aflatoxin, posing health risk to all livestock.",
//     PossiblePreventiveMeasure: "Destroy contaminated feed, test new batches, improve storage conditions"
//   },
//   {
//     Type: "Warning",
//     MonthYear: "Dec 2024",
//     LocationsEffected: "All Water Sources",
//     DiseaseName: "Water Quality Alert",
//     UpdatedDate: "2024-12-12",
//     UpdatedOn: "11:45 AM",
//     DiseaseOverview: "High bacterial count detected in drinking water systems across the farm.",
//     PossiblePreventiveMeasure: "Chlorinate water systems, clean tanks, regular water testing"
//   },
//   {
//     Type: "Info",
//     MonthYear: "Dec 2024",
//     LocationsEffected: "Broiler House 2",
//     DiseaseName: "Heat Stress",
//     UpdatedDate: "2024-12-11",
//     UpdatedOn: "3:30 PM",
//     DiseaseOverview: "Temperature slightly above optimal range, birds showing mild signs of heat stress.",
//     PossiblePreventiveMeasure: "Increase ventilation, provide cool water, adjust feeding times"
//   },
//   {
//     Type: "Critical",
//     MonthYear: "Dec 2024",
//     LocationsEffected: "Quarantine Zone",
//     DiseaseName: "Foot and Mouth Disease",
//     UpdatedDate: "2024-12-10",
//     UpdatedOn: "8:15 AM",
//     DiseaseOverview: "Suspected case in newly arrived cattle showing mouth and foot lesions.",
//     PossiblePreventiveMeasure: "Immediate quarantine, restrict movement, notify veterinary authorities"
//   },
//   {
//     Type: "Info",
//     MonthYear: "Dec 2024",
//     LocationsEffected: "Vaccination Room",
//     DiseaseName: "Vaccination Due",
//     UpdatedDate: "2024-12-09",
//     UpdatedOn: "1:00 PM",
//     DiseaseOverview: "Regular vaccination schedule for Newcastle disease is due this week.",
//     PossiblePreventiveMeasure: "Schedule vaccination, prepare vaccines, record batch numbers"
//   },
//   {
//     Type: "Warning",
//     MonthYear: "Dec 2024",
//     LocationsEffected: "Manure Pit Area",
//     DiseaseName: "Ammonia Levels High",
//     UpdatedDate: "2024-12-08",
//     UpdatedOn: "4:45 PM",
//     DiseaseOverview: "Ammonia concentration above safe limits in enclosed housing areas.",
//     PossiblePreventiveMeasure: "Increase ventilation, adjust manure management, use neutralizers"
//   }
// ];





const fetchDataFromGoogleSheets = async (): Promise<AlertItem[]> => {
  try {
    // Your Sheet.best endpoint
    const response = await fetch(
      'https://sheet.best/api/sheets/YOUR_SHEET_ID'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    // Transform the data
    return rawData.map((row: any) => ({
      Type: row.Type || '',
      MonthYear: row.MonthYear || '',
      LocationsEffected: row['Locations Effected'] || row.LocationsEffected || '',
      DiseaseName: row.DiseaseName || '',
      UpdatedDate: row.UpdatedDate || '',
      UpdatedOn: row.UpdatedOn || '',
      DiseaseOverview: row['Disease Overview'] || row.DiseaseOverview || '',
      PossiblePreventiveMeasure: row['Possible Preventive Measure'] || row.PossiblePreventiveMeasure || ''
    }));
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return [];
  }
};




const RiskAlertsScreen: React.FC<Props> = ({ data: initialData }) => {
  const navigation = useNavigation<NavigationProp>();
  const [data, setData] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const params = useLocalSearchParams();

  const [showAllCritical, setShowAllCritical] = useState(false);
const [showAllWarning, setShowAllWarning] = useState(false);
const [showAllFiltered, setShowAllFiltered] = useState(false);


  useEffect(() => {
    if (params.assessmentResult) {
      try {
        const result = JSON.parse(params.assessmentResult as string);
        setRiskAssessment(result);
        console.log("Risk assessment loaded:", result);
      } catch (e) {
        console.error("Error parsing assessment result", e);
      }
    }
  }, [params.assessmentResult]);

  const processAlertData = (rawData: AlertItem[]): AlertData[] => {
    return rawData.map((item, index) => {
     
const getSeverity = (type: string): "critical" | "warning" | "info" => {
  if (!type) return "info"; 
  
  const typeLower = type.toLowerCase();
  if (typeLower.includes('critical') || typeLower.includes('high')) return "critical";
  if (typeLower.includes('warning') || typeLower.includes('medium')) return "warning";
  return "info";
};
      // Determine status based on data
      const getStatus = (): "active" | "investigating" | "scheduled" | "resolved" => {
        const daysAgo = Math.floor(Math.random() * 7);
        if (daysAgo < 1) return "active";
        if (daysAgo < 3) return "investigating";
        if (daysAgo < 5) return "scheduled";
        return "resolved";
      };

    const getTimeAgo = (dateStr: string) => {
  if (!dateStr) return "Recently";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return "Just now";
  } catch {
    return "Recently";
  }
};

      // Calculate priority (Critical > Warning > Info)
      const getPriority = (severity: string): number => {
        switch (severity) {
          case 'critical': return 3;
          case 'warning': return 2;
          case 'info': return 1;
          default: return 0;
        }
      };

      const severity = getSeverity(item.Type);
      const priority = getPriority(severity);

      return {
        ...item,
        id: `alert-${Date.now()}-${index}`,
        severity,
        status: getStatus(),
        timeAgo: getTimeAgo(item.UpdatedDate),
        priority,
      };
    }).sort((a, b) => b.priority - a.priority);
  };


  

  // Helper functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#EF4444';
      case 'investigating': return '#F59E0B';
      case 'scheduled': return '#3B82F6';
      case 'resolved': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
      case 'high':
      case 'needs attention':
      case 'poor':
        return '#EF4444';
      case 'medium':
      case 'warning':
      case 'good':
        return '#F59E0B';
      case 'low':
      case 'optimal':
      case 'excellent':
      case 'normal':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} color="#EF4444" />;
      case 'down': return <TrendingUp size={16} color="#10B981" style={{ transform: [{ rotate: '180deg' }] }} />;
      case 'stable': return <View style={styles.stableTrend} />;
      default: return null;
    }
  };

  // Helper function to generate AI overview
  const generateChatModelOverview = async () => {
    try {
      Alert.alert("Generating AI Overview", "Analyzing all risk factors...");

      // Simulate API call to AI/chat model
      setTimeout(() => {
        const overview = `
🚨 **Farm Health Risk Assessment Report** 📋

**Overall Status:** MODERATE RISK (Score: 65/100)

**Critical Areas:**
1. Health Check Status - 2 unresolved issues require immediate attention
2. Water Consumption - Trending downward, needs monitoring
3. Vaccination - 15% of animals due for vaccination soon

**Positive Indicators:**
✅ Temperature within optimal range
✅ Feed intake at normal levels
✅ Mortality rate within acceptable limits

**Recommendations:**
1. Schedule health checkup within 3 days
2. Investigate water system for issues
3. Plan vaccination campaign for next week
4. Continue temperature monitoring

**Next Steps:**
- Review detailed report
- Assign tasks to farm staff
- Schedule follow-up assessment in 7 days
        `;

        Alert.alert(
          "AI Risk Overview Generated",
          overview,
          [
            { text: "View Full Report", onPress: () => navigation.navigate('RiskAssessmentResults', { assessmentData: overview }) },
            { text: "Close", style: "cancel" }
          ]
        );
      }, 1500);
    } catch (error) {
      Alert.alert("Error", "Failed to generate AI overview");
    }
  };

  // Calculate overall risk assessment
  const calculateRiskAssessment = (alertData: AlertData[]) => {
    const criticalCount = alertData.filter(item => item.severity === "critical").length;
    const warningCount = alertData.filter(item => item.severity === "warning").length;

    // Calculate risk score based on alerts
    let baseScore = 50;
    baseScore -= criticalCount * 15;
    baseScore -= warningCount * 5;
    baseScore = Math.max(0, Math.min(100, baseScore));

    // Determine overall level
    let overallLevel = "Good";
    if (baseScore < 40) overallLevel = "Critical";
    else if (baseScore < 60) overallLevel = "High";
    else if (baseScore < 80) overallLevel = "Medium";

    // Generate overview
    const overview = `Based on ${alertData.length} active alerts (${criticalCount} critical, ${warningCount} warnings), the farm is at ${overallLevel.toLowerCase()} risk.`;

    setRiskAssessment({
      overallScore: baseScore,
      overallLevel,
      overview,
      criticalCount,
      warningCount,
      totalAlerts: alertData.length,
      lastUpdated: new Date().toISOString()
    });
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Fetch latest risk assessment from backend
  const fetchLatestAssessment = async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/risk/latest`);

      if (response.ok) {
        const data = await response.json();
        setRiskAssessment(data);
        console.log("Loaded latest assessment from backend:", data);
        return true;
      } else if (response.status === 404) {
        console.log("No previous assessments found");
        return false;
      }
    } catch (error) {
      console.error("Error fetching latest assessment:", error);
      return false;
    }
  };

 type AlertRow = {
  id: string;
  type: string;
  value: string;
  risk: string;
  timestamp: string;
  overview?: string;
  recommendation?: string;
};

// Replace your fetchDataFromGoogleSheets function with this:
const fetchDataFromGoogleSheets = async (): Promise<AlertItem[]> => {
  try {
    const url =
      "https://docs.google.com/spreadsheets/d/1GYaSR_EL4c-oKNyiTyx1XOv2aI-ON8WmGJ0G491j35E/export?format=csv";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Debug: Log the raw data structure
          console.log("Raw Google Sheets data:", results.data);
          
          const mapped: AlertItem[] = results.data
            .filter((row: any) => row && row.Type) // Filter out rows without Type
            .map((row: any) => ({
              Type: (row.Type || "").toString().trim(),
              MonthYear: (row.MonthYear || "").toString().trim(),
              LocationsEffected: (row["Locations Effected"] || row.LocationsEffected || "").toString().trim(),
              DiseaseName: (row.DiseaseName || "").toString().trim(),
              UpdatedDate: (row.UpdatedDate || "").toString().trim(),
              UpdatedOn: (row.UpdatedOn || "").toString().trim(),
              DiseaseOverview: (row["Disease Overview"] || row.DiseaseOverview || "").toString().trim(),
              PossiblePreventiveMeasure: (row["Possible Preventive Measure"] || row.PossiblePreventiveMeasure || "").toString().trim()
            }))
            .filter(item => item.Type && item.DiseaseName); // Only include valid items

          console.log(`Parsed ${mapped.length} alerts from Google Sheets`);
          resolve(mapped);
        },
        error: (err : any) => {
          console.error("PapaParse error:", err);
          reject(err);
        },
      });
    });
  } catch (error) {
    console.error("Error fetching from Google Sheets:", error);
    return [];
  }
};


const loadData = async () => {
  setLoading(true);

  try {
    console.log("Starting data load...");
    
    const googleAlerts = await fetchDataFromGoogleSheets();
    console.log(`Got ${googleAlerts.length} alerts from Google Sheets`);

    // 2. Use Google Sheets data or fallback to initialData
    const alertData = googleAlerts.length > 0 ? googleAlerts : (initialData || []);
    
    console.log(`Processing ${alertData.length} total alerts`);
    
    // Debug: Log first few items
    if (alertData.length > 0) {
      console.log("First alert sample:", {
        Type: alertData[0].Type,
        DiseaseName: alertData[0].DiseaseName,
        LocationsEffected: alertData[0].LocationsEffected
      });
    }

    // 3. Process the data
    const processedData = processAlertData(alertData);
    console.log(`Processed ${processedData.length} alerts`);
    setData(processedData);

    // 4. Handle risk assessment
    if (!params.assessmentResult) {
      const loaded = await fetchLatestAssessment?.();
      if (!loaded && processedData.length > 0) {
        calculateRiskAssessment(processedData);
      }
    }
  } catch (error) {
    console.error("Error loading data:", error);
    Alert.alert(
      "Data Error",
      "Unable to load alerts data. Please check your connection and try again."
    );
    
    // Fallback to empty data
    setData([]);
  } finally {
    setLoading(false);
  }
};




  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleExpand = (alertId: string) => {
    setExpandedAlertId(expandedAlertId === alertId ? null : alertId);
  };

  // Filter data based on selected filter
  const filteredData = filter === "all"
    ? data
    : data.filter(item => item.severity === filter);

  // Group alerts by severity for summary
  const criticalAlerts = data.filter(item => item.severity === "critical");
  const warningAlerts = data.filter(item => item.severity === "warning");
  const infoAlerts = data.filter(item => item.severity === "info");

  const riskFactors = [


    {
      factor: "Water Consumption",
      level: "Warning",
      trend: "down",
      icon: "💧",
      value: "88%",
      details: "Slightly below normal"
    },
    {
      factor: "Mortality Rate",
      level: "Normal",
      trend: "stable",
      icon: "📊",
      value: "1.2%",
      details: "Within acceptable range"
    }
  ];

  const renderAlertItem = (alert: AlertData) => {
    const severityColor = getSeverityColor(alert.severity);
    const statusColor = getStatusColor(alert.status);
    const isExpanded = expandedAlertId === alert.id;

    return (
      <TouchableOpacity
        key={alert.id}
        style={[
          styles.alertCard,
          { borderLeftColor: severityColor },
          alert.severity === "critical" && styles.criticalCard,
          alert.severity === "warning" && styles.warningCard,
          isExpanded && styles.expandedCard,
        ]}
        activeOpacity={0.7}
        onPress={() => toggleExpand(alert.id)}
      >
        <View style={styles.alertContent}>
          {/* Header */}
          <View style={styles.alertHeader}>
            <View style={styles.alertTitleContainer}>
              <Text style={styles.alertType}>{alert.DiseaseName}</Text>
              <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                <Text style={styles.severityText}>
                  {alert.Type.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {alert.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Message */}
          <Text style={styles.alertMessage} numberOfLines={isExpanded ? undefined : 2}>
            {alert.DiseaseOverview}
          </Text>

          {/* Metadata */}
          <View style={styles.alertMeta}>
            <View style={styles.metaItem}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.metaText}>{alert.LocationsEffected}</Text>
            </View>

            <View style={styles.metaItem}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.metaText}>{alert.timeAgo}</Text>
            </View>

            <View style={styles.metaItem}>
              <Bell size={14} color="#6B7280" />
              <Text style={styles.metaText}>{alert.MonthYear}</Text>
            </View>
          </View>

          {/* Expand/Collapse Button */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleExpand(alert.id)}
          >
            <Text style={styles.expandText}>
              {isExpanded ? "Show Less" : "View Details"}
            </Text>
            <TrendingUp
              size={16}
              color="#6B7280"
              style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {/* Expanded Details */}
          {isExpanded && (
            <View style={styles.expandedDetails}>
              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <AlertCircle size={16} color="#3B82F6" />
                  <Text style={styles.detailTitle}>Disease Overview</Text>
                </View>
                <Text style={styles.detailText}>{alert.DiseaseOverview}</Text>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <Shield size={16} color="#10B981" />
                  <Text style={styles.detailTitle}>Preventive Measures</Text>
                </View>
                <Text style={styles.detailText}>{alert.PossiblePreventiveMeasure}</Text>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailTitle}>Update Information</Text>
                </View>
                <View style={styles.updateInfo}>
                  <Text style={styles.updateText}>
                    <Text style={styles.bold}>Last Updated:</Text> {alert.UpdatedOn} ({alert.UpdatedDate})
                  </Text>
                  <Text style={styles.updateText}>
                    <Text style={styles.bold}>Reported:</Text> {alert.MonthYear}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <Eye size={16} color="#3B82F6" />
                  <Text style={styles.actionButtonText}>View Full Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
                  <Download size={16} color="#FFFFFF" />
                  <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                    Export Data
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
        <Text style={styles.loadingText}>Loading Alert Data...</Text>
        <Text style={styles.loadingSubtext}>Fetching from monitoring systems</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Risk & Alerts</Text>
          <Text style={styles.subtitle}>Real-time monitoring of farm health and security</Text>
        </View>

        <View style={styles.notificationBadge}>
          <Bell size={24} color="#FFFFFF" />
          {data.length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{data.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.summarySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
          <View style={[styles.summaryCard, styles.criticalSummary]}>
            <View style={styles.summaryIcon}>
              <AlertTriangle size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryValue}>{criticalAlerts.length}</Text>
            <Text style={styles.summaryLabel}>Critical</Text>
            <Text style={styles.summarySubtitle}>Requires action</Text>
          </View>

          <View style={[styles.summaryCard, styles.warningSummary]}>
            <View style={styles.summaryIcon}>
              <Shield size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryValue}>{warningAlerts.length}</Text>
            <Text style={styles.summaryLabel}>Warnings</Text>
            <Text style={styles.summarySubtitle}>Needs attention</Text>
          </View>

          <View style={[styles.summaryCard, styles.infoSummary]}>
            <View style={styles.summaryIcon}>
              <Bell size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryValue}>{infoAlerts.length}</Text>
            <Text style={styles.summaryLabel}>Info</Text>
            <Text style={styles.summarySubtitle}>For monitoring</Text>
          </View>

          <View style={[styles.summaryCard, styles.totalSummary]}>
            <View style={styles.summaryIcon}>
              <AlertCircle size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryValue}>{data.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summarySubtitle}>All active alerts</Text>
          </View>
        </ScrollView>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <View style={styles.filterTitleContainer}>
          <Filter size={18} color="#6B7280" />
          <Text style={styles.filterTitle}>Filter Alerts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
              All Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === "critical" && styles.filterButtonCritical]}
            onPress={() => setFilter("critical")}
          >
            <AlertTriangle size={16} color={filter === "critical" ? "#FFFFFF" : "#EF4444"} />
            <Text style={[styles.filterText, filter === "critical" && styles.filterTextActive]}>
              Critical ({criticalAlerts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === "warning" && styles.filterButtonWarning]}
            onPress={() => setFilter("warning")}
          >
            <Shield size={16} color={filter === "warning" ? "#FFFFFF" : "#F59E0B"} />
            <Text style={[styles.filterText, filter === "warning" && styles.filterTextActive]}>
              Warnings ({warningAlerts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === "info" && styles.filterButtonInfo]}
            onPress={() => setFilter("info")}
          >
            <Bell size={16} color={filter === "info" ? "#FFFFFF" : "#3B82F6"} />
            <Text style={[styles.filterText, filter === "info" && styles.filterTextActive]}>
              Info ({infoAlerts.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Risk Assessment Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Activity size={24} color="#3B82F6" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.sectionTitle}> Risk Assessment</Text>
              <Text style={styles.sectionSubtitle}>Live Track of livestock health metrics</Text>
            </View>
          </View>


        </View>

        {/* Health Metrics Overview */}
        <View style={styles.healthMetrics}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#FEF3C7' }]}>
              <Thermometer size={20} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>39.2°C</Text>
            <Text style={styles.metricLabel}>Avg Temperature</Text>
            <Text style={[styles.metricStatus, { color: '#10B981' }]}>Normal</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#DBEAFE' }]}>
              <Syringe size={20} color="#1D4ED8" />
            </View>
            <Text style={styles.metricValue}>85%</Text>
            <Text style={styles.metricLabel}>Vaccination</Text>
            <Text style={[styles.metricStatus, { color: '#F59E0B' }]}>Due Soon</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#D1FAE5' }]}>
              <Heart size={20} color="#047857" />
            </View>
            <Text style={styles.metricValue}>2</Text>
            <Text style={styles.metricLabel}>Health Issues</Text>
            <Text style={[styles.metricStatus, { color: '#EF4444' }]}>Needs Check</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#F3E8FF' }]}>
              <Calendar size={20} color="#7C3AED" />
            </View>
            <Text style={styles.metricValue}>7</Text>
            <Text style={styles.metricLabel}>Days</Text>
            <Text style={[styles.metricStatus, { color: '#3B82F6' }]}>Next Checkup</Text>
          </View>
        </View>

        <View style={styles.riskGrid}>
          {riskFactors.map((risk, index) => (
            <View key={index} style={styles.riskCard}>
              <View style={styles.riskCardHeader}>
                <Text style={styles.riskIcon}>{risk.icon}</Text>
                <Text style={styles.riskFactor}>{risk.factor}</Text>
              </View>

              <View style={styles.riskDetails}>
                <View style={styles.riskValues}>
                  <Text style={styles.riskValue}>{risk.value}</Text>
                  <Text style={styles.riskDetailsText} numberOfLines={1}>{risk.details}</Text>
                </View>

                <View style={styles.riskIndicators}>
                  <View style={[styles.riskLevelBadge, { backgroundColor: `${getRiskLevelColor(risk.level)}15` }]}>
                    <Text style={[styles.riskLevel, { color: getRiskLevelColor(risk.level) }]}>
                      {risk.level}
                    </Text>
                  </View>
                  <View style={styles.trendContainer}>
                    {getTrendIcon(risk.trend)}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Overall Risk Score */}
        {riskAssessment && (
          <View style={styles.overallRiskContainer}>
            <View style={styles.overallRiskHeader}>
              <Text style={styles.overallRiskTitle}>Overall Risk Score</Text>
              <View style={[styles.riskScoreBadge, { backgroundColor: getRiskLevelColor(riskAssessment.overallLevel) + '15' }]}>
                <Text style={[styles.riskScoreText, { color: getRiskLevelColor(riskAssessment.overallLevel) }]}>
                  {riskAssessment.overallScore}/100
                </Text>
              </View>
            </View>

            <View style={styles.riskProgressContainer}>
              <View style={styles.riskProgressBar}>
                <View style={[
                  styles.riskProgressFill,
                  {
                    width: `${riskAssessment.overallScore}%`,
                    backgroundColor: getRiskLevelColor(riskAssessment.overallLevel)
                  }
                ]} />
              </View>
              <View style={styles.riskProgressLabels}>
                <Text style={styles.riskProgressLabel}>Low</Text>
                <Text style={styles.riskProgressLabel}>Medium</Text>
                <Text style={styles.riskProgressLabel}>High</Text>
              </View>
            </View>

            <View style={[styles.riskLevelContainer, { backgroundColor: getRiskLevelColor(riskAssessment.overallLevel) + '15' }]}>
              <AlertTriangle size={20} color={getRiskLevelColor(riskAssessment.overallLevel)} />
              <Text style={[styles.riskLevelText, { color: getRiskLevelColor(riskAssessment.overallLevel) }]}>
                Risk Level: {riskAssessment.overallLevel}
              </Text>
            </View>

            {(riskAssessment.criticalCount > 0 || riskAssessment.warningCount > 0) && (
              <View style={styles.issueCountsContainer}>
                {riskAssessment.criticalCount > 0 && (
                  <View style={styles.issueCountCard}>
                    <View style={[styles.issueCountIcon, { backgroundColor: '#FEE2E2' }]}>
                      <AlertCircle size={18} color="#EF4444" />
                    </View>
                    <View>
                      <Text style={styles.issueCountValue}>{riskAssessment.criticalCount}</Text>
                      <Text style={styles.issueCountLabel}>Critical Issues</Text>
                    </View>
                  </View>
                )}
                {riskAssessment.warningCount > 0 && (
                  <View style={styles.issueCountCard}>
                    <View style={[styles.issueCountIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Shield size={18} color="#F59E0B" />
                    </View>
                    <View>
                      <Text style={styles.issueCountValue}>{riskAssessment.warningCount}</Text>
                      <Text style={styles.issueCountLabel}>Warnings</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* AI Overview */}
            <View style={styles.aiOverviewSection}>
              <View style={styles.aiOverviewHeader}>
                <Activity size={18} color="#3B82F6" />
                <Text style={styles.aiOverviewTitle}>AI Analysis Overview</Text>
              </View>
              <Text style={styles.riskOverview}>{riskAssessment.overview}</Text>
            </View>

            {/* Recommendations */}
            {riskAssessment.recommendations && riskAssessment.recommendations.length > 0 && (
              <View style={styles.recommendationsSection}>
                <View style={styles.recommendationsHeader}>
                  <Shield size={18} color="#10B981" />
                  <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
                </View>
                {riskAssessment.recommendations.map((recommendation: string, index: number) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationBullet}>
                      <Text style={styles.recommendationNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.generateReportButton}
              onPress={() => router.push("/riskForm")}
            >
              <BarChart2 size={18} color="#FFFFFF" />
              <Text style={styles.generateReportText}>Take New Risk Assessment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

   {/* Critical Alerts Section */}
{criticalAlerts.length > 0 && filter !== "info" && filter !== "warning" && (
  <View style={styles.section}>
    
    <View style={[styles.sectionHeader, { backgroundColor: "#FEE2E2" }]}>
      <View style={styles.sectionTitleContainer}>
        <AlertTriangle size={20} color="#EF4444" />
        <Text style={[styles.sectionTitle, { color: "#EF4444", marginLeft: 8 }]}>
          Critical Alerts
        </Text>
      </View>

      <TouchableOpacity onPress={() => setShowAllCritical(!showAllCritical)}>
        <Text style={[styles.sectionCount, { color: "#EF4444" }]}>
          {showAllCritical ? "View Less" : "View All"}
        </Text>
      </TouchableOpacity>
    </View>

    {(showAllCritical ? criticalAlerts : criticalAlerts.slice(0, 5)).map(alert =>
      renderAlertItem(alert)
    )}
  </View>
)}



    {/* Warning Alerts Section */}
{warningAlerts.length > 0 && filter !== "info" && filter !== "critical" && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Shield size={20} color="#F59E0B" />
        <Text style={[styles.sectionTitle, { color: '#F59E0B', marginLeft: 8 }]}>
          Warning Alerts
        </Text>
      </View>

      <TouchableOpacity onPress={() => setShowAllWarning(!showAllWarning)}>
        <Text style={styles.sectionCount}>
          {showAllWarning ? "View Less" : "View All"}
        </Text>
      </TouchableOpacity>
    </View>

    {(showAllWarning ? warningAlerts : warningAlerts.slice(0, 5))
      .map(alert => renderAlertItem(alert))}
  </View>
)}

     {/* Filtered Alerts View */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleContainer}>
      <Bell size={20} color="#6B7280" />
      <Text style={styles.sectionTitle}>
        {filter === "all" ? "All Alerts" :
          filter === "critical" ? "Critical Alerts" :
          filter === "warning" ? "Warning Alerts" : "Info Alerts"}
      </Text>
    </View>

    <TouchableOpacity onPress={() => setShowAllFiltered(!showAllFiltered)}>
      <Text style={styles.sectionCount}>
        {showAllFiltered ? "View Less" : "View All"}
      </Text>
    </TouchableOpacity>
  </View>

  {filteredData.length === 0 ? (
    <View style={styles.emptyState}>
      <Bell size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No alerts found</Text>
      <Text style={styles.emptySubtitle}>
        {filter === "all"
          ? "All systems are operating normally"
          : `No ${filter} alerts at this time`}
      </Text>
    </View>
  ) : (
    (showAllFiltered ? filteredData : filteredData.slice(0, 5))
      .map(alert => renderAlertItem(alert))
  )}
</View>


      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Clock size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.footerNote}>
          Data updates every 5 minutes • {data.length} active alerts
        </Text>
      </View>
    </ScrollView>
  );
};

export default RiskAlertsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  notificationBadge: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  summarySection: {
    paddingHorizontal: 24,
    marginTop: -16,
  },
  summaryScroll: {
    paddingRight: 24,
  },
  summaryCard: {
    width: 150,
    height: 160,
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  criticalSummary: {
    backgroundColor: '#EF4444',
  },
  warningSummary: {
    backgroundColor: '#F59E0B',
  },
  infoSummary: {
    backgroundColor: '#3B82F6',
  },
  totalSummary: {
    backgroundColor: '#10B981',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  filterScroll: {
    paddingRight: 24,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterButtonCritical: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  filterButtonWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  filterButtonInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  assessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  assessmentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  healthMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricStatus: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  riskCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  riskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  riskIcon: {
    fontSize: 24,
  },
  riskFactor: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  riskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskValues: {
    flex: 1,
  },
  riskValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  riskDetailsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  riskIndicators: {
    alignItems: 'flex-end',
    gap: 8,
  },
  riskLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskLevel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  trendContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stableTrend: {
    width: 16,
    height: 2,
    backgroundColor: '#6B7280',
    borderRadius: 1,
  },
  overallRiskContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  overallRiskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRiskTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  riskScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskScoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  riskProgressContainer: {
    marginBottom: 16,
  },
  riskProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  riskProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskProgressLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  riskOverview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  generateReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateReportText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderLeftWidth: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  criticalCard: {
    backgroundColor: '#FEF2F2',
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
  },
  expandedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  alertContent: {
    padding: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  alertType: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  alertMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expandText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 22,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  updateInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  updateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 20,
  },
  bold: {
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#4B5563',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  // Risk Assessment Styles
  riskLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
  },
  riskLevelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  issueCountsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  issueCountCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  issueCountIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueCountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  issueCountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  aiOverviewSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  aiOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiOverviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  recommendationsSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#047857',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  recommendationBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  recommendationNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});