const API_BASE_URL = 'http://127.0.0.1:8000/api';

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const vendorSelect = document.getElementById('vendor');
const configFileInput = document.getElementById('configFile');
const fileNameSpan = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');
const statusMessage = document.getElementById('statusMessage');
const resultsSection = document.getElementById('resultsSection');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

let currentUploadId = null;

// File input display
configFileInput.addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name || '';
    fileNameSpan.textContent = fileName;
    document.querySelector('.file-input-text').textContent = fileName || 'Choose file...';
});

// Form submission
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const vendor = vendorSelect.value;
    const file = configFileInput.files[0];

    if (!vendor || !file) {
        showStatus('Please select vendor and file', 'error');
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('config', file);
    formData.append('vendor', vendor);

    // Update UI
    setLoading(true);
    showStatus('Analyzing configuration...', 'loading');
    resultsSection.style.display = 'none';

    try {
        // Upload config
        const response = await fetch(`${API_BASE_URL}/uploads/`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        // Handle response (single or multiple results)
        const result = data.results ? data.results[0] : data;
        
        if (result.status === 'failed') {
            showStatus(`Analysis failed: ${result.error}`, 'error');
            setLoading(false);
            return;
        }

        if (result.status === 'review') {
            showStatus('Configuration needs review. Partial results available.', 'error');
        } else {
            showStatus('Analysis complete!', 'success');
        }

        currentUploadId = result.id;
        
        // Display results
        displayResults(result);
        setLoading(false);

        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);

    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        setLoading(false);
    }
});

// Download PDF
downloadPdfBtn.addEventListener('click', async () => {
    if (!currentUploadId) return;

    try {
        showStatus('Generating PDF...', 'loading');
        
        const response = await fetch(`${API_BASE_URL}/uploads/report/pdf/?ids=${currentUploadId}`);
        
        if (!response.ok) {
            throw new Error('PDF generation failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${currentUploadId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showStatus('PDF downloaded successfully!', 'success');
        setTimeout(() => hideStatus(), 3000);

    } catch (error) {
        console.error('Error:', error);
        showStatus(`PDF download failed: ${error.message}`, 'error');
    }
});

// Display results
function displayResults(data) {
    resultsSection.style.display = 'block';

    // Upload metadata
    document.getElementById('uploadId').textContent = data.id;
    document.getElementById('vendorInfo').textContent = data.vendor.toUpperCase();
    
    const statusBadge = document.getElementById('statusInfo');
    statusBadge.textContent = data.status;
    statusBadge.className = `meta-value status-badge ${data.status}`;

    // Summary
    const report = data.compliance_report;
    if (report && report.summary) {
        const summary = report.summary;
        const summaryGrid = document.getElementById('summaryGrid');
        summaryGrid.innerHTML = `
            <div class="summary-card total">
                <div class="label">Total Rules</div>
                <div class="value">${summary.total}</div>
            </div>
            <div class="summary-card passed">
                <div class="label">Passed</div>
                <div class="value">${summary.passed}</div>
            </div>
            <div class="summary-card failed">
                <div class="label">Failed</div>
                <div class="value">${summary.failed}</div>
            </div>
            <div class="summary-card critical">
                <div class="label">Critical/High</div>
                <div class="value">${summary.critical_high}</div>
            </div>
        `;
    }

    // Baseline data
    if (data.baseline_json) {
        const baselineData = document.getElementById('baselineData');
        baselineData.innerHTML = '';

        const baseline = data.baseline_json;
        const displayFields = [
            { key: 'vendor', label: 'Vendor' },
            { key: 'hostname', label: 'Hostname' },
            { key: 'os_version', label: 'OS Version' },
            { key: 'management.ssh_version', label: 'SSH Version' },
            { key: 'management.telnet_enabled', label: 'Telnet Enabled' },
            { key: 'management.http_enabled', label: 'HTTP Enabled' },
            { key: 'authentication.aaa_methods', label: 'AAA Methods' },
            { key: 'authentication.password_encryption', label: 'Password Encryption' }
        ];

        displayFields.forEach(field => {
            const value = getNestedValue(baseline, field.key);
            if (value !== null && value !== undefined) {
                const item = document.createElement('div');
                item.className = 'baseline-item';
                item.innerHTML = `
                    <div class="key">${field.label}</div>
                    <div class="value">${formatValue(value)}</div>
                `;
                baselineData.appendChild(item);
            }
        });
    }

    // Compliance rules
    if (report && report.results) {
        const rulesData = document.getElementById('rulesData');
        rulesData.innerHTML = '';

        report.results.forEach(rule => {
            const ruleItem = document.createElement('div');
            ruleItem.className = `rule-item ${rule.status.toLowerCase()}`;
            
            const statusEmoji = rule.status === 'Pass' ? '✅' : rule.status === 'Fail' ? '❌' : '⚠️';
            
            ruleItem.innerHTML = `
                <div class="rule-header">
                    <span class="rule-status">${statusEmoji}</span>
                    <div class="rule-title">
                        <div class="rule-id">[${rule.rule_id}]</div>
                        <div class="rule-name">${rule.name}</div>
                    </div>
                </div>
                <div class="rule-details">
                    <div class="rule-detail">
                        <span class="label">Field</span>
                        <span class="value">${rule.field}</span>
                    </div>
                    <div class="rule-detail">
                        <span class="label">Expected</span>
                        <span class="value">${formatValue(rule.expected)}</span>
                    </div>
                    <div class="rule-detail">
                        <span class="label">Actual</span>
                        <span class="value">${formatValue(rule.actual)}</span>
                    </div>
                </div>
                ${rule.reason ? `<div style="margin-top: 12px; font-size: 14px; color: var(--text-secondary); font-style: italic;">${rule.reason}</div>` : ''}
            `;
            
            rulesData.appendChild(ruleItem);
        });
    }
}

// Helper functions
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

function formatValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ') || 'Empty';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

function hideStatus() {
    statusMessage.className = 'status-message';
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}
