const checkAdminStatus = async (req, res, next) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
  
    const pool = await connectDB();
  
    try {
      // Check if user exists in AdminUsers table
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query(`
          SELECT 1 FROM AdminUsers WHERE Email = @email
        `);
  
      const isAdmin = result.recordset.length > 0;
  
      // Insert or update user in Users table
      await pool.request()
        .input('email', sql.NVarChar, email)
        .query(`
          MERGE INTO Users AS target
          USING (VALUES (@email)) AS source (Email)
          ON target.Email = source.Email
          WHEN MATCHED THEN
            UPDATE SET LastLoginDate = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (Email, LastLoginDate, CreatedAt)
            VALUES (@email, GETDATE(), GETDATE());
        `);
  
      res.json({ isAdmin });
    } catch (error) {
      console.error('Error checking admin status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  module.exports = { checkAdminStatus };