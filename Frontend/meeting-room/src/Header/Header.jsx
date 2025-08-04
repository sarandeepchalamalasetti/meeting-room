import React,{useState} from 'react';
import './Header.css';
import {useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify'
const Header = () => {
    const[showDropdown , setShowDropdown]=useState(false);
    const navigate = useNavigate();
    const handlelogout = ()=>{
        sessionStorage.clear();
        toast.success("Logout Successfull");
        navigate('/login');
    }
    const toggleDropdown = ()=>{
        setShowDropdown((prev)=>!prev)
    }
const user = JSON.parse(sessionStorage.getItem('user'));
const name = user?.name?.trim() || '';
const nameParts = name.split(' ').filter(Boolean);

const initials = nameParts.length >= 2
  ? nameParts[0][0].toUpperCase() + nameParts[nameParts.length - 1][0].toUpperCase()
  : nameParts[0][0].toUpperCase();


    return (
        <>
            <header className="header-header">
                <div className="header-container">
                    <div className="header-content">
                        <div className="date-section">
                            <span className="date-text">
                                {
                                new Date().toLocaleDateString('en-US',{
                                    weekday:'long',
                                    month:'long',
                                    day:'numeric',
                                    year:'numeric'
                                })
                                }
                                </span>
                        </div>
        <div className="welcome-section">
          <span className="welcome-text">Welcome Back, <strong>{name}</strong></span>
        </div>
                        <div className="user-section">
                            <div className="user-avatar" onClick={toggleDropdown}>
                                {initials}
                            </div>
                            <div className="user-info">
                                <div className="user-name">{user?.name || "User"}</div>
                                <div className="user-role">{user?.role || "Role"}</div>
                            </div>
                            {showDropdown &&(
                                <div className='user-dropdown-menu'>
                                    <button className='user-dropdown-item' onClick={handlelogout}>
                                        <i className='fas fa-sign-out-alt'></i>Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
