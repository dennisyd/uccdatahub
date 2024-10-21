import pandas as pd

# Define the hierarchy of designations, lower numbers have higher priority
hierarchy = [
    "Owner", "Founder", "CEO", "Chairman of the Board", "Chairperson of the Board", 
    "Chief Executive Officer", "Chief Financial Officer", "Chief Operating Officer", 
    "President", "Managing Member", "General Manager", "Vice President", 
    "Treasurer", "Secretary", "Manager", "Member"
]

def get_designation_priority(designation):
    """Returns the priority of the official designation based on the defined hierarchy."""
    designation_lower = str(designation).lower()  # Convert to string in case of missing values
    
    # Give highest priority to designations that contain 'Owner' or 'Founder'
    if 'owner' in designation_lower or 'founder' in designation_lower:
        return 0  # Highest priority
    
    # Find the designation in the hierarchy
    for i, title in enumerate(hierarchy):
        if title.lower() in designation_lower:
            return i + 1
    
    # If the designation is not found in the hierarchy, return a very large number (lowest priority)
    return len(hierarchy) + 1  # Lowest priority

def process_csv(input_file, output_file):
    # Read the CSV file using pandas
    df = pd.read_csv(input_file)
    
    # Print the column names
    print("Column names:", df.columns.tolist())
    
    # Adjust the column names to match what's in your CSV file
    filing_col = 'Filing Number'
    designation_col = 'Official Designation'
    date_col = 'Filing Date'  # Assuming this is the date column in your CSV
    
    # Check if the necessary columns exist
    if filing_col not in df.columns or designation_col not in df.columns or date_col not in df.columns:
        print(f"Error: Missing required columns {filing_col}, {designation_col}, or {date_col} in the CSV file.")
        return
    
    # Convert the date column to datetime format
    df[date_col] = pd.to_datetime(df[date_col], format='%m/%d/%Y', errors='coerce')
    
    # Define the cutoff date (in this case, 8/31/2024)
    cutoff_date = pd.to_datetime('2024-08-31')
    
    # Filter the dataframe to only include rows with dates later than the cutoff date
    df = df[df[date_col] > cutoff_date]
    
    # Sort the dataframe by filing number and designation priority
    df['priority'] = df[designation_col].apply(get_designation_priority)
    
    # Sort the dataframe by filing number and priority (ascending)
    df_sorted = df.sort_values(by=[filing_col, 'priority'])
    
    # Drop duplicates, keeping the first occurrence (the highest priority one)
    df_deduplicated = df_sorted.drop_duplicates(subset=[filing_col], keep='first')
    
    # Remove the 'priority' column as it's no longer needed
    df_deduplicated = df_deduplicated.drop(columns=['priority'])
    
    # Save the processed data to a new CSV file
    df_deduplicated.to_csv(output_file, index=False)
    
    print(f"Processed data saved to {output_file}")

# Specify your input and output file paths
input_file = 'c:/users/denni/downloads/nc_sept_2024.csv'
output_file = 'nc_data.csv'

# Process the CSV file
process_csv(input_file, output_file)
