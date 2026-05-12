import React from 'react';

const SystemFeatures = () => {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '8px',
        padding: '40px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#0f172a',
          marginBottom: '30px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          System Features
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#475569',
          textAlign: 'center',
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          The Road Accident Hotspot Alert System includes the following key features:
        </p>

        <div style={{
          display: 'grid',
          gap: '30px'
        }}>
          {/* Feature 1 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>1</span>
              User Registration and Login
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              This feature allows road users to create accounts and securely log into the system. 
              Registered users can access personalized services such as receiving alerts and submitting 
              accident reports. Authentication ensures that only authorized users can access specific 
              system functions.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>2</span>
              Accident Hotspot Detection
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              The system analyzes historical accident records obtained from RTSA to identify locations 
              with high accident frequency. These areas are classified as accident hotspots and are 
              stored in database for visualization and alert generation.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>3</span>
              Interactive Map Visualization
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              The system provides an interactive map that displays identified accident hotspots. 
              Users can easily view high-risk areas and understand accident-prone zones 
              before traveling.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>4</span>
              Real-Time Alert Notifications
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              This feature sends notifications or warning alerts to users when they approach or 
              enter accident hotspot areas. The alerts help improve driver awareness and encourage 
              safer driving decisions.
            </p>
          </div>

          {/* Feature 5 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>5</span>
              Accident Reporting Module
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              Users can report accidents directly through the system by submitting accident details 
              such as location, description, and time of occurrence. This helps keep accident 
              records updated.
            </p>
          </div>

          {/* Feature 6 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>6</span>
              Accident Data Management
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              The administrator can manage accident records by viewing, updating, deleting, and 
              verifying submitted accident reports to maintain accurate system data.
            </p>
          </div>

          {/* Feature 7 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>7</span>
              Hotspot Database Storage
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              The system stores accident records, hotspot coordinates, user details, and submitted 
              reports in MongoDB for efficient retrieval and management.
            </p>
          </div>

          {/* Feature 8 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>8</span>
              Admin Dashboard
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              The administrator dashboard allows system administrators to monitor accident reports, 
              manage users, verify accident submissions, and oversee hotspot updates.
            </p>
          </div>

          {/* Feature 9 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>9</span>
              Historical Accident Data Analysis
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              The system processes historical RTSA accident data to identify trends based on 
              accident frequency, locations, and causes of accidents.
            </p>
          </div>

          {/* Feature 10 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#2563eb',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#2563eb',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>10</span>
              Responsive Web Interface
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              The system is accessible on multiple devices such as smartphones, tablets, and 
              computers through a responsive web interface.
            </p>
          </div>

          {/* Feature 11 */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease',
            borderLeft: '4px solid #10b981'
          }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#10b981',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>11</span>
              GPS Route Redirection Away from Accident Hotspots
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: '1.7',
              margin: '0'
            }}>
              The system automatically redirects GPS navigation routes to avoid identified accident 
              hotspots, providing safer alternative paths and reducing exposure to high-risk areas.
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '40px',
          padding: '30px',
          background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
          borderRadius: '12px',
          border: '2px solid #0ea5e9',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#0c4a6e',
            marginBottom: '15px'
          }}>
            Advanced navigation & safety features
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#0c4a6e',
            lineHeight: '1.6',
            margin: '0'
          }}>
            Our system combines real-time data, intelligent routing, and comprehensive accident 
            analysis to create a safer driving experience for all road users in Ndola. 
            With interconnected road networks and proactive alert systems, we help drivers 
            make informed decisions and avoid potential hazards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemFeatures;
