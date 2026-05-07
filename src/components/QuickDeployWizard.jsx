import React, { useState } from 'react';
import { Shield, Settings, FileText, RefreshCw, ArrowRight, ArrowLeft, CheckCircle, Monitor, Laptop, Smartphone, Tablet, Loader } from 'lucide-react';

// Display metadata for all known manifest policyType values.
// Add new entries here whenever new types are introduced in PolicyManifest.json.
const POLICY_TYPE_META = {
  CompliancePolicies: {
    name: 'Compliance Policies',
    description: 'Device compliance requirements and health checks',
    icon: Shield,
    color: 'blue'
  },
  EndpointSecurity: {
    name: 'Endpoint Security',
    description: 'Security configurations managed from the Endpoint Security blade (Antivirus, Firewall, Disk Encryption etc.)',
    icon: Shield,
    color: 'red'
  },
  SettingsCatalog: {
    name: 'Settings Catalog',
    description: 'Device management and user experience settings',
    icon: Settings,
    color: 'green'
  },
  UpdatePolicies: {
    name: 'Update Policies',
    description: 'Windows Update for Business configuration. (Do not deploy if using Autopatch)',
    icon: RefreshCw,
    color: 'orange'
  },
  DriverUpdateProfiles: {
    name: 'Driver Update Policies',
    description: 'Windows Update for Business driver update configuration. (Do not deploy if using Autopatch)',
    icon: RefreshCw,
    color: 'yellow'
  },
  DeviceConfiguration: {
    name: 'Device Configuration',
    description: 'Legacy device configuration profiles',
    icon: Settings,
    color: 'gray'
  },
  AdminTemplates: {
    name: 'Administrative Templates',
    description: 'Group Policy-style administrative template configurations',
    icon: FileText,
    color: 'purple'
  },
  AppProtectionPolicies: {
    name: 'App Protection Policies',
    description: 'Application data protection and access control for managed apps',
    icon: Shield,
    color: 'teal'
  },
};

// Hardcoded fallback used when no manifest is available (pre-3.8 branches)
const FALLBACK_POLICY_TYPES = ['CompliancePolicies', 'EndpointSecurity', 'SettingsCatalog', 'UpdatePolicies'];

const QuickDeployWizard = ({ onPolicyTypesSelected, onBack, selectedVersion, fetchPolicyTypes }) => {
  const [selectedPolicyTypes, setSelectedPolicyTypes] = useState([]);
  const [selectedOS, setSelectedOS] = useState([]);
  const [currentStep, setCurrentStep] = useState('os-selection');
  // null = not yet fetched; string[] = resolved from manifest (or fallback)
  const [availablePolicyTypes, setAvailablePolicyTypes] = useState(null);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  const osOptions = [
    {
      id: 'WINDOWS',
      name: 'Windows',
      description: 'Windows 11 Devices deployed by Autopilot',
      icon: Monitor,
      color: 'blue',
      enabled: true
    },
    {
      id: 'MACOS',
      name: 'macOS',
      description: 'Apple MacOS Devices deployed by ABM',
      icon: Laptop,
      color: 'gray',
      enabled: true
    },
    {
      id: 'BYOD',
      name: 'BYOD',
      description: 'App Protection Policies',
      icon: Shield,
      color: 'green',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'iOS',
      name: 'iOS',
      description: 'Fully-Managed iOS Devices',
      icon: Smartphone,
      color: 'orange',
      enabled: false,
      comingSoon: true
    },
    {
      id: 'ANDROID',
      name: 'Android',
      description: 'Not Available',
      icon: Tablet,
      color: 'purple',
      enabled: false,
      comingSoon: false
    }
  ];

  // Resolve the list of policy type cards from fetched manifest types (or fallback).
  // Each card is { id, name, description, icon, color }.
  const getPolicyTypeCards = () => {
    const types = availablePolicyTypes && availablePolicyTypes.length > 0
      ? availablePolicyTypes
      : FALLBACK_POLICY_TYPES;
    return types.map(typeId => ({
      id: typeId,
      ...(POLICY_TYPE_META[typeId] ?? {
        name: typeId,
        description: '',
        icon: Settings,
        color: 'gray'
      })
    }));
  };

  const toggleOS = (osId, enabled) => {
    if (!enabled) return; // Don't allow selection of disabled options
    
    setSelectedOS(prev => 
      prev.includes(osId) 
        ? prev.filter(id => id !== osId)
        : [...prev, osId]
    );
  };

  const togglePolicyType = (typeId) => {
    setSelectedPolicyTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const selectAllPolicyTypes = () => {
    const cards = getPolicyTypeCards();
    const allIds = cards.map(c => c.id);
    setSelectedPolicyTypes(selectedPolicyTypes.length === allIds.length ? [] : allIds);
  };

  const handleOSContinue = async () => {
    if (selectedOS.length === 0) return;
    setCurrentStep('policy-types');
    setIsLoadingTypes(true);
    try {
      if (fetchPolicyTypes) {
        const types = await fetchPolicyTypes(selectedOS);
        setAvailablePolicyTypes(types.length > 0 ? types : FALLBACK_POLICY_TYPES);
      } else {
        setAvailablePolicyTypes(FALLBACK_POLICY_TYPES);
      }
    } catch {
      setAvailablePolicyTypes(FALLBACK_POLICY_TYPES);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const handlePolicyTypesContinue = () => {
    if (selectedPolicyTypes.length > 0) {
      onPolicyTypesSelected({ policyTypes: selectedPolicyTypes, osTypes: selectedOS });
    }
  };

  const handleStepBack = () => {
    if (currentStep === 'policy-types') {
      setCurrentStep('os-selection');
    } else {
      onBack();
    }
  };

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h2>New Deployment Setup</h2>
        {currentStep === 'os-selection' && (
          <p>Select the operating systems you want to deploy policies for</p>
        )}
        {currentStep === 'policy-types' && (
          <p>Select the policy types you want to deploy from the latest OpenIntuneBaseline</p>
        )}
        {selectedVersion && (
          <div className="version-info">
            <span className="version-badge">Latest Version: {selectedVersion}</span>
          </div>
        )}
      </div>

      {/* OS Selection Step */}
      {currentStep === 'os-selection' && (
        <div className="os-selection">
          <div className="selection-header">
            <h3>Choose Operating Systems</h3>
          </div>

          <div className="policy-types-grid">
            {osOptions.map(os => {
              const IconComponent = os.icon;
              const isSelected = selectedOS.includes(os.id);
              const isDisabled = !os.enabled;
              
              return (
                <div 
                  key={os.id}
                  className={`policy-type-card ${isSelected ? 'selected' : ''} ${os.color} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => toggleOS(os.id, os.enabled)}
                >
                  <div className="card-header">
                    <div className="card-icon">
                      <IconComponent size={32} />
                    </div>
                    <div className="card-check">
                      {isSelected && <CheckCircle size={20} />}
                    </div>
                    {os.comingSoon && (
                      <div className="coming-soon-badge">
                        Coming Soon
                      </div>
                    )}
                  </div>
                  <div className="card-content">
                    <h4>{os.name}</h4>
                    <p>{os.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Policy Types Selection Step */}
      {currentStep === 'policy-types' && (
        <div className="policy-types-selection">
          <div className="selection-header">
            <h3>Choose Policy Types</h3>
            {!isLoadingTypes && (
              <button
                className="btn-link select-all"
                onClick={selectAllPolicyTypes}
              >
                {selectedPolicyTypes.length === getPolicyTypeCards().length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {isLoadingTypes ? (
            <div className="loading-policy-types">
              <Loader size={28} className="spinning" />
              <p>Loading available policy types…</p>
            </div>
          ) : (
            <div className="policy-types-grid">
              {getPolicyTypeCards().map(type => {
                const IconComponent = type.icon;
                const isSelected = selectedPolicyTypes.includes(type.id);

                return (
                  <div
                    key={type.id}
                    className={`policy-type-card ${isSelected ? 'selected' : ''} ${type.color}`}
                    onClick={() => togglePolicyType(type.id)}
                  >
                    <div className="card-header">
                      <div className="card-icon">
                        <IconComponent size={32} />
                      </div>
                      <div className="card-check">
                        {isSelected && <CheckCircle size={20} />}
                      </div>
                    </div>
                    <div className="card-content">
                      <h4>{type.name}</h4>
                      <p>{type.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="wizard-navigation">
        <button className="btn-secondary" onClick={handleStepBack}>
          <ArrowLeft size={16} />
          Back
        </button>
        
        {currentStep === 'os-selection' && (
          <button 
            className="btn-primary"
            onClick={handleOSContinue}
            disabled={selectedOS.length === 0}
          >
            Continue
            <ArrowRight size={16} />
          </button>
        )}

        {currentStep === 'policy-types' && (
          <button
            className="btn-primary"
            onClick={handlePolicyTypesContinue}
            disabled={selectedPolicyTypes.length === 0 || isLoadingTypes}
          >
            Continue
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      <div className="wizard-footer">
        {currentStep === 'os-selection' && (
          <p className="selection-summary">
            {selectedOS.length > 0 
              ? `${selectedOS.length} operating system${selectedOS.length === 1 ? '' : 's'} selected`
              : 'Select at least one operating system to continue'
            }
          </p>
        )}
        {currentStep === 'policy-types' && (
          <p className="selection-summary">
            {selectedPolicyTypes.length > 0 
              ? `${selectedPolicyTypes.length} policy type${selectedPolicyTypes.length === 1 ? '' : 's'} selected`
              : 'Select at least one policy type to continue'
            }
          </p>
        )}
      </div>
    </div>
  );
};

export default QuickDeployWizard;
